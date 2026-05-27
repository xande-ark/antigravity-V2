import type { CrawledUrl, CrawlResult } from '../types';

const PROXY_LIST = [
  '', // Try direct first
  'https://api.allorigins.win/raw?url=',
  'https://api.codetabs.com/v1/proxy?quest=',
  'https://corsproxy.io/?',
  'https://thingproxy.freeboard.io/fetch/'
];

/** Extract base origin from any URL string */
const getOrigin = (url: string): string => {
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`);
    return `${u.protocol}//${u.host}`;
  } catch {
    return `https://${url}`;
  }
};

/** Fetch raw text trying direct access first, then CORS proxies */
export const proxyFetch = async (url: string, timeoutMs = 8000): Promise<string> => {
  for (const proxy of PROXY_LIST) {
    const fetchUrl = proxy ? `${proxy}${encodeURIComponent(url)}` : url;
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch(fetchUrl, { signal: controller.signal });
      clearTimeout(timer);
      if (res.ok) {
        return await res.text();
      }
    } catch {
      // try next proxy if CORS blocks or times out
    }
  }
  throw new Error(`Falha ao acessar ${url} após tentar múltiplos proxies.`);
};

/** Get HTTP status code trying our own server proxy, then direct, then fallback proxies */
export const getHttpStatus = async (url: string): Promise<number> => {
  // 1. Try our own Server-Side Proxy (best for bypassing CORS and Bot detection)
  try {
    const res = await fetch(`/api/proxy?url=${encodeURIComponent(url)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.status > 0) return data.status;
    }
  } catch {
    // If not on Vercel or API fails, continue to next methods
  }

  // 2. Try direct HEAD/GET (works if site allows CORS)
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(url, { method: 'HEAD', signal: controller.signal });
    clearTimeout(timer);
    if (res.status > 0) return res.status;
  } catch {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(url, { method: 'GET', signal: controller.signal });
      clearTimeout(timer);
      if (res.status > 0) return res.status;
    } catch { }
  }

  // 3. Fallback to public proxies
  for (const proxy of PROXY_LIST.slice(1)) {
    try {
      const fetchUrl = proxy.includes('allorigins.win/get') 
        ? `${proxy}${encodeURIComponent(url)}` 
        : `${proxy}${encodeURIComponent(url)}`;
        
      const res = await fetch(fetchUrl);
      if (res.ok) {
        if (proxy.includes('allorigins')) {
          const data = await res.json();
          return data?.status?.http_code || 0;
        }
        return res.status;
      }
    } catch {
      continue;
    }
  }

  return 0;
};

/** Parse any sitemap XML (urlset or sitemapindex), returns URLs */
const parseSitemap = (xml: string): string[] => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'application/xml');

  // Sitemap index → collect child sitemap <loc> values
  const sitemapLocs = Array.from(doc.querySelectorAll('sitemapindex sitemap loc'));
  if (sitemapLocs.length > 0) {
    // Return child sitemap URLs (caller will fetch each one)
    return sitemapLocs.map(el => el.textContent?.trim() ?? '').filter(Boolean);
  }

  // Regular urlset
  return Array.from(doc.querySelectorAll('urlset url loc'))
    .map(el => el.textContent?.trim() ?? '')
    .filter(Boolean);
};

/** Try to find sitemap URL from robots.txt */
const findSitemapInRobots = async (origin: string): Promise<string[]> => {
  try {
    const robotsText = await proxyFetch(`${origin}/robots.txt`, 5000);
    const lines = robotsText.split('\n');
    const sitemaps = lines
      .filter(line => line.toLowerCase().startsWith('sitemap:'))
      .map(line => line.substring(8).trim())
      .filter(Boolean);
    return sitemaps;
  } catch {
    return [];
  }
};

/** Try known sitemap paths until one succeeds, return { url, xml } or null */
const discoverSitemap = async (origin: string): Promise<{ url: string; xml: string } | null> => {
  const sitemaps: string[] = await findSitemapInRobots(origin);

  // Common sitemap locations
  const commonPaths = [
    '/sitemap.xml',
    '/sitemap_index.xml',
    '/wp-sitemap.xml',
    '/sitemap-pt-post-2024.xml',
    '/sitemap-pt-page-2024.xml',
    '/sitemap/sitemap.xml',
    '/sitemap_1.xml'
  ];
  
  for (const path of commonPaths) {
    const sUrl = `${origin}${path}`;
    if (!sitemaps.includes(sUrl)) sitemaps.push(sUrl);
  }

  for (const url of sitemaps) {
    try {
      const xml = await proxyFetch(url, 8000);
      // Basic sanity check: look for XML tags
      if (xml.toLowerCase().includes('<urlset') || xml.toLowerCase().includes('<sitemapindex')) {
        return { url, xml };
      }
    } catch {
      // try next
    }
  }
  return null;
};

/** Resolve child sitemaps (if sitemapindex) into a flat list of page URLs */
const resolveAllUrls = async (
  initialXml: string,
  onProgress?: (msg: string) => void
): Promise<string[]> => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(initialXml, 'application/xml');
  const isSitemapIndex = doc.documentElement.nodeName.toLowerCase() === 'sitemapindex';
  
  const parsed = parseSitemap(initialXml);

  if (!isSitemapIndex) {
    return parsed;
  }

  // Fetch child sitemaps IN PARALLEL (limit to 10 to avoid overload)
  const childSitemaps = parsed.slice(0, 10);
  onProgress?.(`Carregando ${childSitemaps.length} sub-sitemaps em paralelo...`);
  
  const results = await Promise.allSettled(
    childSitemaps.map(async (childUrl) => {
      const childXml = await proxyFetch(childUrl, 5000); // 5s timeout per child
      return parseSitemap(childXml);
    })
  );

  const allUrls: string[] = [];
  results.forEach(res => {
    if (res.status === 'fulfilled') allUrls.push(...res.value);
  });

  return Array.from(new Set(allUrls));
};

/** Fallback: extract links from the homepage HTML if sitemap is missing */
const extractLinksFromHtml = (html: string, origin: string): string[] => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const links = Array.from(doc.querySelectorAll('a[href]'));
  
  const urls = new Set<string>();
  const originUrl = new URL(origin);

  links.forEach(link => {
    try {
      const href = link.getAttribute('href') || '';
      const absoluteUrl = new URL(href, origin).href;
      const targetUrl = new URL(absoluteUrl);
      
      // Only keep links from the same domain
      if (targetUrl.hostname === originUrl.hostname && targetUrl.pathname.length > 1) {
        // Clean fragments and trailing slashes for comparison
        const cleaned = absoluteUrl.split('#')[0].replace(/\/$/, '');
        if (cleaned !== origin.replace(/\/$/, '')) {
          urls.add(cleaned);
        }
      }
    } catch {
      // ignore invalid URLs
    }
  });

  return Array.from(urls);
};

export interface CrawlOptions {
  projectUrls: string[];          // URLs already in the project (for comparison)
  maxUrls?: number;               // max URLs to check (default 50)
  onProgress?: (done: number, total: number, currentUrl: string) => void;
}

export const crawlDomain = async (
  domainInput: string,
  options: CrawlOptions = { projectUrls: [] }
): Promise<CrawlResult> => {
  // Wrap the entire crawl in a 30-second global timeout so it NEVER hangs forever
  const GLOBAL_TIMEOUT_MS = 30000;
  const timeoutPromise = new Promise<CrawlResult>((_, reject) =>
    setTimeout(() => reject(new Error('Timeout: o rastreamento demorou mais de 30 segundos.')), GLOBAL_TIMEOUT_MS)
  );

  return Promise.race([_crawlDomain(domainInput, options), timeoutPromise]);
};

const _crawlDomain = async (
  domainInput: string,
  options: CrawlOptions = { projectUrls: [] }
): Promise<CrawlResult> => {
  const { projectUrls = [], maxUrls = 50, onProgress } = options;
  const origin = getOrigin(domainInput);
  const startedAt = new Date().toISOString();

  const base: CrawlResult = {
    domain: origin,
    sitemapFound: false,
    sitemapUrl: null,
    totalFound: 0,
    urls: [],
    startedAt,
    finishedAt: null,
    error: null,
  };

  try {
    // 1. Discover sitemap
    onProgress?.(0, 1, 'Procurando sitemap.xml...');
    let sitemapResult = await discoverSitemap(origin);

    let foundUrls: string[] = [];

    if (sitemapResult) {
      base.sitemapFound = true;
      base.sitemapUrl = sitemapResult.url;
      onProgress?.(0, 1, 'Analisando estrutura do sitemap...');
      foundUrls = await resolveAllUrls(sitemapResult.xml, (msg) => onProgress?.(0, 1, msg));
    } else {
      // FALLBACK: Extract from homepage
      onProgress?.(0, 1, 'Sitemap não encontrado. Tentando extrair links da home...');
      try {
        const homeHtml = await proxyFetch(origin, 8000);
        foundUrls = extractLinksFromHtml(homeHtml, origin);
        if (foundUrls.length > 0) {
          base.sitemapFound = false; // Still false as it's not a sitemap
          base.error = "Sitemap não encontrado, mas algumas subpáginas foram detectadas na home.";
        }
      } catch {
        // failed fallback too
      }
    }

    if (foundUrls.length === 0) {
      return {
        ...base,
        error: `Nenhum sitemap ou subpágina encontrado em ${origin}.`,
        finishedAt: new Date().toISOString(),
      };
    }

    const targetHostname = new URL(origin).hostname.replace(/^www\./, '');
    const filteredUrls = foundUrls.filter(u => {
      try {
        const uHost = new URL(u).hostname.replace(/^www\./, '');
        return uHost === targetHostname;
      } catch { return false; }
    });

    const limitedUrls = filteredUrls.slice(0, maxUrls);
    base.totalFound = foundUrls.length;

    // Build set of project URLs for comparison
    const projectUrlSet = new Set(projectUrls.map(u => u.toLowerCase().replace(/\/$/, '')));

    // 3. Check each URL in batches to avoid extremely long sequential wait times
    const crawledUrls: CrawledUrl[] = [];
    const BATCH_SIZE = 10;
    
    for (let i = 0; i < limitedUrls.length; i += BATCH_SIZE) {
      const batch = limitedUrls.slice(i, i + BATCH_SIZE);
      onProgress?.(i, limitedUrls.length, `Analisando lote ${i/BATCH_SIZE + 1}...`);
      
      const batchResults = await Promise.all(batch.map(async (url) => {
        const httpCode = await getHttpStatus(url);
        const normalizedUrl = url.toLowerCase().replace(/\/$/, '');

        let status: CrawledUrl['status'];
        if (httpCode === 200) status = 'ok';
        else if (httpCode >= 300 && httpCode < 400) status = 'redirect';
        else if (httpCode === 404 || httpCode === 410) status = 'broken';
        else status = 'broken';

        return {
          url,
          status,
          httpCode,
          inSitemap: true,
          inProject: projectUrlSet.has(normalizedUrl),
        };
      }));
      
      crawledUrls.push(...batchResults);
    }

    // 4. Also flag project URLs not in sitemap
    for (const projUrl of projectUrls) {
      const normalizedProjUrl = projUrl.toLowerCase().replace(/\/$/, '');
      const alreadyIncluded = crawledUrls.some(
        c => c.url.toLowerCase().replace(/\/$/, '') === normalizedProjUrl
      );
      if (!alreadyIncluded) {
        const httpCode = await getHttpStatus(projUrl);
        crawledUrls.push({
          url: projUrl,
          status: httpCode === 200 ? 'ok' : 'broken',
          httpCode,
          inSitemap: false,
          inProject: true,
        });
      }
    }

    onProgress?.(limitedUrls.length, limitedUrls.length, 'Concluído');

    return {
      ...base,
      urls: crawledUrls,
      finishedAt: new Date().toISOString(),
    };
  } catch (err: any) {
    return {
      ...base,
      error: err?.message ?? 'Erro desconhecido durante o rastreamento.',
      finishedAt: new Date().toISOString(),
    };
  }
};
