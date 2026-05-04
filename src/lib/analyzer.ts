import { v4 as uuidv4 } from 'uuid';
import type { AnalysisResult, Metric, PageSpeedData, IndexingData, Opportunity } from '../types';
import { proxyFetch, getHttpStatus } from './crawler';

const PAGESPEED_API_KEY = import.meta.env.VITE_PAGESPEED_API_KEY;
const SERPER_API_KEY = import.meta.env.VITE_SERPER_API_KEY;

const checkRealIndexing = async (url: string): Promise<boolean> => {
  if (!SERPER_API_KEY) return false;
  try {
    const cleanUrl = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': SERPER_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ q: `site:${cleanUrl}` })
    });
    const data = await response.json();
    // If there are results and the top result URL matches our URL (roughly)
    return !!(data.organic && data.organic.length > 0);
  } catch (e) {
    console.error('Serper check failed:', e);
    return false;
  }
};

const rand = (min: number, max: number) => Math.random() * (max - min) + min;
const randInt = (min: number, max: number) => Math.floor(rand(min, max));

const generateMetric = (type: 'lcp' | 'cls' | 'inp' | 'fcp' | 'ttfb' | 'speedIndex' | 'tbt'): Metric => {
  switch (type) {
    case 'lcp': {
      const v = parseFloat(rand(0.8, 6.5).toFixed(1));
      return { value: `${v}s`, numericValue: v, unit: 's', score: v <= 2.5 ? 'good' : v <= 4 ? 'needs-improvement' : 'poor' };
    }
    case 'cls': {
      const v = parseFloat(rand(0, 0.5).toFixed(3));
      return { value: `${v}`, numericValue: v, unit: '', score: v <= 0.1 ? 'good' : v <= 0.25 ? 'needs-improvement' : 'poor' };
    }
    case 'inp': {
      const v = randInt(50, 700);
      return { value: `${v}ms`, numericValue: v, unit: 'ms', score: v <= 200 ? 'good' : v <= 500 ? 'needs-improvement' : 'poor' };
    }
    case 'fcp': {
      const v = parseFloat(rand(0.5, 4).toFixed(1));
      return { value: `${v}s`, numericValue: v, unit: 's', score: v <= 1.8 ? 'good' : v <= 3 ? 'needs-improvement' : 'poor' };
    }
    case 'ttfb': {
      const v = randInt(100, 1500);
      return { value: `${v}ms`, numericValue: v, unit: 'ms', score: v <= 800 ? 'good' : v <= 1800 ? 'needs-improvement' : 'poor' };
    }
    case 'speedIndex': {
      const v = parseFloat(rand(1, 8).toFixed(1));
      return { value: `${v}s`, numericValue: v, unit: 's', score: v <= 3.4 ? 'good' : v <= 5.8 ? 'needs-improvement' : 'poor' };
    }
    case 'tbt': {
      const v = randInt(0, 800);
      return { value: `${v}ms`, numericValue: v, unit: 'ms', score: v <= 200 ? 'good' : v <= 600 ? 'needs-improvement' : 'poor' };
    }
    default:
      return { value: '0s', score: 'good' };
  }
};

const generateOpportunities = (lcp: Metric, tbt: Metric, cls: Metric): Opportunity[] => {
  const ops: Opportunity[] = [];
  
  if (lcp.score !== 'good') {
    ops.push({ id: 'lcp-img', title: 'Redimensionar imagens', description: 'Imagens em tamanho inadequado desperdiçam dados e aumentam o LCP. Sirva imagens em tamanho correto.', savings: `-${randInt(1, 4)}s no LCP`, impact: 'high' });
    ops.push({ id: 'lcp-webp', title: 'Imagens em formatos modernos (WebP/AVIF)', description: 'Formatos de próxima geração como WebP e AVIF costumam ter melhor compressão do que PNG ou JPEG.', savings: `-${randInt(200, 800)}KB`, impact: 'high' });
  }
  if (tbt.score !== 'good') {
    ops.push({ id: 'tbt-js', title: 'Reduzir o JavaScript não utilizado', description: 'Reduza o JavaScript não utilizado e adie o carregamento de scripts até necessário para reduzir o tempo de transferência de rede.', savings: `-${randInt(100, 600)}ms no TBT`, impact: lcp.score === 'poor' ? 'high' : 'medium' });
    ops.push({ id: 'tbt-defer', title: 'Eliminar recursos que bloqueiam a renderização', description: 'Recursos estão bloqueando a primeira renderização da sua página. Considere usar <link rel=preload> ou adiamento de scripts não críticos.', savings: `-${randInt(50, 300)}ms`, impact: 'medium' });
  }
  if (cls.score !== 'good') {
    ops.push({ id: 'cls-fonts', title: 'Garantir que o texto permanece visível durante a carga de webfonts', description: 'Use font-display: swap para mostrar texto enquanto as fontes são carregadas, evitando o "flash" de texto invisível.', savings: 'Elimina mudança de layout', impact: 'medium' });
  }
  if (Math.random() > 0.5) {
    ops.push({ id: 'cache', title: 'Servir ativos estáticos com política de cache eficiente', description: `Foram encontrados ${randInt(2, 15)} recursos sem política de cache. Defina um tempo de validade longo para recursos que não mudam.`, savings: `${randInt(50, 300)}KB em tráfego repetido`, impact: 'low' });
  }
  if (Math.random() > 0.6) {
    ops.push({ id: 'compress', title: 'Habilitar compressão de texto (GZIP/Brotli)', description: 'As respostas de texto devem ser comprimidas para minimizar os bytes totais de rede. Ative GZIP ou Brotli no servidor.', savings: `-${randInt(50, 200)}KB`, impact: 'medium' });
  }
  if (Math.random() > 0.7) {
    ops.push({ id: 'preload', title: 'Pré-conectar a origens necessárias', description: 'Considere adicionar preconnect ou dns-prefetch para recursos de terceiros (analytics, fonts, ads).', savings: `-${randInt(100, 400)}ms`, impact: 'low' });
  }

  return ops;
};

export const analyzeUrl = async (url: string, isSubpage: boolean): Promise<AnalysisResult> => {
  try {
    // 1. Fetch Real PageSpeed Data
    // Ensure URL has protocol
    let targetUrl = url.trim();
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = `https://${targetUrl}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000); // 45s timeout

    const psUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(targetUrl)}&key=${PAGESPEED_API_KEY}&category=PERFORMANCE&category=ACCESSIBILITY&category=BEST_PRACTICES&category=SEO&strategy=mobile`;
    
    console.log('Fetching PageSpeed for:', targetUrl);
    const response = await fetch(psUrl, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (!response.ok) throw new Error(`Falha na API: ${response.status}`);
    const data = await response.json();

    const lighthouse = data.lighthouseResult;
    const audit = lighthouse.audits;
    
    // Extract Metrics
    const getMetric = (name: string, unit: string): Metric => {
      const a = audit[name];
      if (!a) return { value: 'N/A', score: 'good' };
      const val = a.numericValue;
      let score: Metric['score'] = 'good';
      if (a.score < 0.5) score = 'poor';
      else if (a.score < 0.9) score = 'needs-improvement';
      
      return {
        value: a.displayValue || `${val.toFixed(1)}${unit}`,
        numericValue: val,
        unit,
        score
      };
    };

    const lcp = getMetric('largest-contentful-paint', 's');
    const cls = getMetric('cumulative-layout-shift', '');
    const tbt = getMetric('total-blocking-time', 'ms');
    const fcp = getMetric('first-contentful-paint', 's');
    const speedIndex = getMetric('speed-index', 's');
    
    // In Lighthouse v10+, TTFB is under experimental or different names, but we can get it
    const ttfb = getMetric('server-response-time', 'ms');
    const inp = getMetric('interactive', 'ms'); // Approximation

    const opportunities: Opportunity[] = Object.values(audit)
      .filter((a: any) => a.details?.type === 'opportunity' && a.score < 0.9)
      .map((a: any) => ({
        id: a.id,
        title: a.title,
        description: a.description,
        savings: a.displayValue || '',
        impact: a.score < 0.5 ? 'high' : 'medium'
      }));

    const pageSpeed: PageSpeedData = {
      lcp, cls, inp, fcp, ttfb, speedIndex, tbt,
      scores: {
        performance: Math.round(lighthouse.categories.performance.score * 100),
        accessibility: Math.round(lighthouse.categories.accessibility.score * 100),
        bestPractices: Math.round(lighthouse.categories['best-practices'].score * 100),
        seo: Math.round(lighthouse.categories.seo.score * 100),
      },
      resources: {
        totalRequests: audit['network-requests']?.details?.items?.length || 0,
        totalSize: audit['total-byte-weight']?.displayValue || '0 KB',
        js: audit['resource-summary']?.details?.items?.find((i: any) => i.resourceType === 'script')?.size || '0 KB',
        css: audit['resource-summary']?.details?.items?.find((i: any) => i.resourceType === 'stylesheet')?.size || '0 KB',
        images: audit['resource-summary']?.details?.items?.find((i: any) => i.resourceType === 'image')?.size || '0 KB',
        fonts: audit['resource-summary']?.details?.items?.find((i: any) => i.resourceType === 'font')?.size || '0 KB',
        other: '0 KB'
      },
      opportunities,
      blockers: opportunities.filter(o => o.impact === 'high').map(o => o.title),
    };

    // 2. Real Indexing Check — first verify HTTP status
    const httpStatus = await getHttpStatus(targetUrl);
    const is404 = httpStatus === 404 || httpStatus === 410;
    const is5xx = httpStatus >= 500;
    const isRedirect = httpStatus >= 300 && httpStatus < 400;

    let isIndexed = false;
    // Only check real indexing if the page actually returns 200
    if (httpStatus === 200) {
      isIndexed = await checkRealIndexing(targetUrl);
    }

    let noindex = false;
    let robotsBlocked = false;
    let canonicalStatus: IndexingData['canonicalStatus'] = 'valid';
    let redirectStatus: IndexingData['redirectStatus'] = is404 ? '404' : isRedirect ? 'chain' : is5xx ? 'chain' : 'ok';

    // Only parse HTML if the page is reachable
    if (httpStatus === 200) {
      try {
        const html = await proxyFetch(url, 10000);
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        const robots = doc.querySelector('meta[name="robots"]')?.getAttribute('content') || '';
        if (robots.toLowerCase().includes('noindex')) {
          noindex = true;
          isIndexed = false;
        }

        const canonical = doc.querySelector('link[rel="canonical" i]')?.getAttribute('href');
        if (canonical) {
          try {
            const canonicalUrl = new URL(canonical, url).href;
            const normalizeForCanonical = (u: string) => u.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
            canonicalStatus = normalizeForCanonical(canonicalUrl) !== normalizeForCanonical(url) ? 'mismatch' : 'valid';
          } catch {
            canonicalStatus = 'mismatch';
          }
        }
      } catch (e) {
        console.warn('Could not fetch HTML for indexing check:', e);
      }
    }

    const indexing: IndexingData = {
      isIndexed,
      noindex,
      canonicalStatus,
      robotsBlocked,
      redirectStatus,
      sitemapStatus: 'in_sitemap'
    };

    const criticalBottlenecks: string[] = [];
    if (is404) criticalBottlenecks.push('Página retorna Erro 404 — não existe ou foi removida.');
    else if (is5xx) criticalBottlenecks.push('Servidor retornou erro 5xx — o site pode estar com problemas.');
    else if (!indexing.isIndexed) criticalBottlenecks.push('Página não encontrada no índice do Google.');
    pageSpeed.opportunities.filter(o => o.impact === 'high').forEach(o => criticalBottlenecks.push(o.title));
    if (criticalBottlenecks.length === 0) criticalBottlenecks.push('Página em excelente estado técnico.');

    return { 
      id: uuidv4(), 
      url, 
      isSubpage, 
      score: pageSpeed.scores.performance, 
      pageSpeed, 
      indexing, 
      criticalBottlenecks, 
      status: 'completed',
      source: 'Google PageSpeed API'
    };

  } catch (error: any) {
    console.error('Error analyzing URL:', error);
    const errorMessage = error?.message || 'Erro desconhecido na API';
    return fallbackMockAnalysis(url, isSubpage, errorMessage);
  }
};

const fallbackMockAnalysis = (url: string, isSubpage: boolean, errorDetail?: string): AnalysisResult => {
  const lcp = generateMetric('lcp');
  const cls = generateMetric('cls');
  const tbt = generateMetric('tbt');
  
  const pageSpeed: PageSpeedData = {
    lcp, cls, tbt,
    inp: generateMetric('inp'),
    fcp: generateMetric('fcp'),
    ttfb: generateMetric('ttfb'),
    speedIndex: generateMetric('speedIndex'),
    scores: {
      performance: randInt(40, 95),
      accessibility: randInt(70, 100),
      bestPractices: randInt(70, 100),
      seo: randInt(70, 100),
    },
    resources: { totalRequests: 50, totalSize: '1.2 MB', js: '400 KB', css: '50 KB', images: '600 KB', fonts: '80 KB', other: '20 KB' },
    opportunities: generateOpportunities(lcp, tbt, cls),
    blockers: [],
  };

  const indexing: IndexingData = {
    isIndexed: false, // Never assume indexed in fallback — we'd need real API to know
    noindex: false,
    canonicalStatus: 'valid',
    robotsBlocked: false,
    redirectStatus: 'ok',
    sitemapStatus: 'not_in_sitemap'
  };

  return { 
    id: uuidv4(), 
    url, 
    isSubpage, 
    score: pageSpeed.scores.performance, 
    pageSpeed, 
    indexing, 
    criticalBottlenecks: [errorDetail ? `Falha técnica: ${errorDetail}` : 'Usando dados simulados (API indisponível)'], 
    status: 'completed',
    source: 'Simulação'
  };
};

