export interface Project {
  id: string;
  name: string;
  createdAt: string;
}

export interface Metric {
  value: string;
  score: 'good' | 'needs-improvement' | 'poor';
  numericValue?: number;
  unit?: string;
}

export interface Opportunity {
  id: string;
  title: string;
  description: string;
  savings: string;
  impact: 'high' | 'medium' | 'low';
}

export interface ResourceSummary {
  totalRequests: number;
  totalSize: string;
  js: string;
  css: string;
  images: string;
  fonts: string;
  other: string;
}

export interface PageSpeedData {
  // Core Web Vitals (Field Data)
  lcp: Metric;
  cls: Metric;
  inp: Metric;

  // Additional Lab Metrics
  fcp: Metric;
  ttfb: Metric;
  speedIndex: Metric;
  tbt: Metric; // Total Blocking Time

  // Lighthouse Scores (0-100)
  scores: {
    performance: number;
    accessibility: number;
    bestPractices: number;
    seo: number;
  };

  // Resources
  resources: ResourceSummary;

  // Opportunities (what to fix)
  opportunities: Opportunity[];

  // Render blocking
  blockers: string[];
}

export interface IndexingData {
  isIndexed: boolean;
  noindex: boolean;
  canonicalStatus: 'valid' | 'missing' | 'mismatch';
  robotsBlocked: boolean;
  redirectStatus: 'ok' | 'chain' | '404' | 'other';
  sitemapStatus: 'in_sitemap' | 'not_in_sitemap';
}

export interface AnalysisResult {
  id: string;
  url: string;
  isSubpage: boolean;
  score: number;
  pageSpeed: PageSpeedData;
  pageSpeedDesktop?: PageSpeedData;
  indexing: IndexingData;
  criticalBottlenecks: string[];
  isCrawling?: boolean;
  crawlData?: CrawlResult;
  source?: 'Google PageSpeed API' | 'Simulação';
  status: 'pending' | 'analyzing' | 'completed' | 'error';
}

export interface AnalysisSession {
  id: string;
  projectId: string;
  date: string;
  results: AnalysisResult[];
}

// ─── Crawler Types ───────────────────────────────────
export type CrawlUrlStatus = 'ok' | 'broken' | 'redirect' | 'checking' | 'pending';

export interface CrawledUrl {
  url: string;
  status: CrawlUrlStatus;
  httpCode: number | null;
  inSitemap: boolean;
  inProject: boolean;
}

export interface CrawlResult {
  domain: string;
  sitemapFound: boolean;
  sitemapUrl: string | null;
  totalFound: number;
  urls: CrawledUrl[];
  startedAt: string;
  finishedAt: string | null;
  error: string | null;
}
