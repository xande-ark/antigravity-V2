import React, { useState } from 'react';
import type { AnalysisResult, Metric, Opportunity } from '../types';
import { X, CheckCircle2, XCircle, Users, AlertTriangle, Layers, TrendingUp, RefreshCw } from 'lucide-react';
import { analyzeDesktopUrl } from '../lib/analyzer';

const normalizeResult = (result: AnalysisResult): AnalysisResult => {
  const fallbackMetric: Metric = { value: 'N/A', score: 'good' };
  return {
    ...result,
    pageSpeed: {
      lcp: result.pageSpeed?.lcp ?? fallbackMetric,
      cls: result.pageSpeed?.cls ?? fallbackMetric,
      inp: result.pageSpeed?.inp ?? fallbackMetric,
      fcp: result.pageSpeed?.fcp ?? fallbackMetric,
      ttfb: result.pageSpeed?.ttfb ?? fallbackMetric,
      speedIndex: result.pageSpeed?.speedIndex ?? fallbackMetric,
      tbt: result.pageSpeed?.tbt ?? fallbackMetric,
      blockers: result.pageSpeed?.blockers ?? [],
      scores: result.pageSpeed?.scores ?? { performance: result.score ?? 0, accessibility: 0, bestPractices: 0, seo: 0 },
      resources: result.pageSpeed?.resources ?? { totalRequests: 0, totalSize: 'N/A', js: 'N/A', css: 'N/A', images: 'N/A', fonts: 'N/A', other: 'N/A' },
      opportunities: result.pageSpeed?.opportunities ?? [],
    },
    pageSpeedDesktop: result.pageSpeedDesktop ? {
      lcp: result.pageSpeedDesktop.lcp ?? fallbackMetric,
      cls: result.pageSpeedDesktop.cls ?? fallbackMetric,
      inp: result.pageSpeedDesktop.inp ?? fallbackMetric,
      fcp: result.pageSpeedDesktop.fcp ?? fallbackMetric,
      ttfb: result.pageSpeedDesktop.ttfb ?? fallbackMetric,
      speedIndex: result.pageSpeedDesktop.speedIndex ?? fallbackMetric,
      tbt: result.pageSpeedDesktop.tbt ?? fallbackMetric,
      blockers: result.pageSpeedDesktop.blockers ?? [],
      scores: result.pageSpeedDesktop.scores ?? { performance: result.score ?? 0, accessibility: 0, bestPractices: 0, seo: 0 },
      resources: result.pageSpeedDesktop.resources ?? { totalRequests: 0, totalSize: 'N/A', js: 'N/A', css: 'N/A', images: 'N/A', fonts: 'N/A', other: 'N/A' },
      opportunities: result.pageSpeedDesktop.opportunities ?? [],
    } : undefined,
    indexing: {
      isIndexed: result.indexing?.isIndexed ?? false,
      noindex: result.indexing?.noindex ?? false,
      canonicalStatus: result.indexing?.canonicalStatus ?? 'valid',
      robotsBlocked: result.indexing?.robotsBlocked ?? false,
      redirectStatus: result.indexing?.redirectStatus ?? 'ok',
      sitemapStatus: result.indexing?.sitemapStatus ?? 'not_in_sitemap',
    },
    criticalBottlenecks: result.criticalBottlenecks ?? [],
  };
};

interface Props {
  result: AnalysisResult | null;
  onClose: () => void;
  onUpdateResult?: (updatedResult: AnalysisResult) => void;
}

const getScoreColor = (score: number) => {
  if (score >= 90) return 'var(--success)';
  if (score >= 50) return 'var(--warning)';
  return 'var(--error)';
};

const getMetricColor = (score: 'good' | 'needs-improvement' | 'poor') => {
  if (score === 'good') return 'var(--success)';
  if (score === 'needs-improvement') return 'var(--warning)';
  return 'var(--error)';
};

const getMetricBadge = (score: 'good' | 'needs-improvement' | 'poor') => {
  const cls = score === 'good' ? 'badge-success' : score === 'needs-improvement' ? 'badge-warning' : 'badge-error';
  const text = score === 'good' ? 'BOM' : score === 'needs-improvement' ? 'MELHORAR' : 'RUIM';
  return <span className={`badge ${cls}`}>{text}</span>;
};

const CircleProgress = ({ score, label }: { score: number; label: string }) => {
  const color = getScoreColor(score);
  const rad = 26;
  const circ = 2 * Math.PI * rad;
  const offset = circ - (score / 100) * circ;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      <div style={{ position: 'relative', width: '68px', height: '68px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="68" height="68" style={{ transform: 'rotate(-90deg)', position: 'absolute' }}>
          <circle cx="34" cy="34" r={rad} fill="transparent" stroke="var(--border-color)" strokeWidth="4" />
          <circle cx="34" cy="34" r={rad} fill="transparent" stroke={color} strokeWidth="4"
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s ease-out' }} />
        </svg>
        <span style={{ fontSize: '1.1rem', fontWeight: 800, color }}>{score}</span>
      </div>
      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center' }}>{label}</span>
    </div>
  );
};

const MetricRow = ({ label, metric, description }: { label: string; metric: Metric; description: string }) => (
  <div style={{ padding: '14px 0', borderBottom: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px', alignItems: 'start' }}>
    <div>
      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{description}</div>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
      <span style={{ fontSize: '1.1rem', fontWeight: 800, color: getMetricColor(metric.score) }}>{metric.value}</span>
      {getMetricBadge(metric.score)}
    </div>
  </div>
);

const OpportunityRow = ({ op }: { op: Opportunity }) => {
  const impactColor = op.impact === 'high' ? 'var(--error)' : op.impact === 'medium' ? 'var(--warning)' : 'var(--text-muted)';
  const impactBg = op.impact === 'high' ? 'var(--error-bg)' : op.impact === 'medium' ? 'var(--warning-bg)' : 'rgba(113,113,122,0.1)';
  return (
    <div style={{ padding: '14px 0', borderBottom: '1px solid var(--border-color)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '6px' }}>
        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{op.title}</span>
        <span style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: '4px', background: impactBg, color: impactColor, fontWeight: 700, flexShrink: 0 }}>
          {op.savings}
        </span>
      </div>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>{op.description}</p>
    </div>
  );
};

const StatusRow = ({ label, description, okText, errorText, isError }: { label: string; description: string; okText: string; errorText: string; isError: boolean }) => (
  <div style={{ padding: '14px 0', borderBottom: '1px solid var(--border-color)' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
      <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: isError ? 'var(--error)' : 'var(--success)', fontWeight: 700, fontSize: '0.8rem' }}>
        {isError ? <XCircle size={14} /> : <CheckCircle2 size={14} />}
        {isError ? errorText : okText}
      </div>
    </div>
    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>{description}</p>
  </div>
);

import { generateAIInsights } from '../lib/aiInsights';

const ResourceBar = ({ label, value, total, color }: { label: string; value: string; total: string; color: string }) => {
  const numValue = parseFloat(value);
  const numTotal = parseFloat(total);
  const pct = isNaN(numValue) || isNaN(numTotal) || numTotal === 0 ? 10 : Math.max(5, (numValue / numTotal) * 100);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
      <div style={{ width: '70px', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right', flexShrink: 0 }}>{label}</div>
      <div style={{ flex: 1, height: '6px', background: 'var(--bg-app)', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.min(100, pct)}%`, background: color, borderRadius: '3px' }} />
      </div>
      <div style={{ width: '60px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', flexShrink: 0 }}>{value}</div>
    </div>
  );
};

// Simple Markdown parser for basic rendering
const renderMarkdown = (text: string) => {
  const html = text
    .replace(/^### (.*$)/gim, '<h3 style="color: var(--accent-primary); margin-top: 16px; margin-bottom: 8px;">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 style="color: white; margin-top: 20px; margin-bottom: 12px;">$1</h2>')
    .replace(/^\* (.*$)/gim, '<li style="margin-left: 20px; margin-bottom: 4px;">$1</li>')
    .replace(/^- (.*$)/gim, '<li style="margin-left: 20px; margin-bottom: 4px;">$1</li>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong style="color: white;">$1</strong>')
    .replace(/\n/gim, '<br />');
  
  return <div style={{ lineHeight: '1.6', fontSize: '0.9rem', color: 'var(--text-secondary)' }} dangerouslySetInnerHTML={{ __html: html }} />;
};

export const DetailDrawer: React.FC<Props> = ({ result, onClose, onUpdateResult }) => {
  const [activeTab, setActiveTab] = useState<'pagespeed' | 'indexacao' | 'ia'>('pagespeed');
  const [psStrategy, setPsStrategy] = useState<'mobile' | 'desktop'>('mobile');
  const [psSection, setPsSection] = useState<'overview' | 'metrics' | 'opportunities' | 'resources'>('overview');
  const [aiInsight, setAiInsight] = useState<string>('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiError, setAiError] = useState<string>('');
  const [isFetchingDesktop, setIsFetchingDesktop] = useState(false);
  
  const isOpen = !!result;
  const r = result ? normalizeResult(result) : null;

  // Reset AI state when opening a new result
  React.useEffect(() => {
    if (result) {
      setAiInsight('');
      setAiError('');
      setActiveTab('pagespeed');
      setPsStrategy('mobile');
    }
  }, [result]);

  const currentPS = r ? (psStrategy === 'desktop' && r.pageSpeedDesktop ? r.pageSpeedDesktop : r.pageSpeed) : null;

  const handleGenerateInsight = async () => {
    if (!r) return;
    setIsGeneratingAi(true);
    setAiError('');
    try {
      const insight = await generateAIInsights(r);
      setAiInsight(insight);
    } catch (error: any) {
      setAiError(error.message || 'Erro ao gerar análise.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleSelectDesktop = async () => {
    setPsStrategy('desktop');
    if (r && !r.pageSpeedDesktop && onUpdateResult && r.url) {
      setIsFetchingDesktop(true);
      try {
        const desktopData = await analyzeDesktopUrl(r.url);
        onUpdateResult({
          ...r,
          pageSpeedDesktop: desktopData
        });
      } catch (e: any) {
        console.error('Failed to fetch desktop data', e);
        // Pode ser tratado com um toast futuramente
      } finally {
        setIsFetchingDesktop(false);
      }
    }
  };

  return (
    <>
      <div 
        onClick={onClose} 
        style={{ 
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 99,
          opacity: isOpen ? 1 : 0, pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'opacity 0.4s ease', backdropFilter: 'blur(2px)'
        }} 
      />

      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: '520px',
        background: 'var(--bg-sidebar)',
        borderLeft: '1px solid var(--border-color)',
        zIndex: 100,
        display: 'flex', flexDirection: 'column',
        transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.05)',
        boxShadow: isOpen ? '-10px 0 30px rgba(0,0,0,0.5)' : 'none'
      }}>
        {r && (
          <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* HEADER - GSC STYLE */}
            <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', flexShrink: 0, background: r.indexing.isIndexed ? 'rgba(34,197,94,0.03)' : 'rgba(239,68,68,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    {r.indexing.isIndexed ? (
                      <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CheckCircle2 size={14} color="white" />
                      </div>
                    ) : (
                      <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--error)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <XCircle size={14} color="white" />
                      </div>
                    )}
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                      {r.indexing.isIndexed ? 'A URL está no Google' : 'A URL não está no Google'}
                    </h2>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>{r.url}</p>
                </div>
                <button onClick={onClose} style={{ color: 'var(--text-muted)', padding: '4px', marginTop: '-8px' }}>
                  <X size={20} />
                </button>
              </div>

              <div style={{ display: 'flex', gap: '24px' }}>
                <div style={{ flex: 1, background: 'var(--bg-app)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>Status</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: r.indexing.isIndexed ? 'var(--success)' : 'var(--error)' }} />
                    <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>{r.indexing.isIndexed ? 'Indexado' : 'Não Indexado'}</span>
                  </div>
                </div>
                <div style={{ flex: 1, background: 'var(--bg-app)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>PageSpeed</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: getScoreColor(currentPS ? currentPS.scores.performance : r.score) }}>{currentPS ? currentPS.scores.performance : r.score}/100</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{(currentPS ? currentPS.scores.performance : r.score) >= 90 ? 'Excelente' : 'Melhorar'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginTop: '20px' }}>
                <button
                  onClick={() => setActiveTab('pagespeed')}
                  style={{
                    flex: 1, padding: '12px 0', background: 'none', border: 'none',
                    borderBottom: activeTab === 'pagespeed' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                    color: activeTab === 'pagespeed' ? 'var(--text-primary)' : 'var(--text-muted)',
                    fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  PageSpeed
                </button>
                <button
                  onClick={() => setActiveTab('indexacao')}
                  style={{
                    flex: 1, padding: '12px 0', background: 'none', border: 'none',
                    borderBottom: activeTab === 'indexacao' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                    color: activeTab === 'indexacao' ? 'var(--text-primary)' : 'var(--text-muted)',
                    fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  Indexação
                </button>
                <button
                  onClick={() => setActiveTab('ia')}
                  style={{
                    flex: 1, padding: '12px 0', background: 'none', border: 'none',
                    borderBottom: activeTab === 'ia' ? '2px solid var(--warning)' : '2px solid transparent',
                    color: activeTab === 'ia' ? 'var(--warning)' : 'var(--text-muted)',
                    fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                  }}
                >
                  Consultor IA ⚡
                </button>
              </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              {activeTab === 'pagespeed' && currentPS && (
                <>
                  <div style={{ padding: '20px 24px 0', display: 'flex', justifyContent: 'center' }}>
                    <div style={{ background: 'var(--bg-tertiary)', borderRadius: '8px', padding: '4px', display: 'flex', gap: '4px' }}>
                      <button 
                        onClick={() => setPsStrategy('mobile')}
                        style={{ padding: '8px 16px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, border: 'none', background: psStrategy === 'mobile' ? 'var(--bg-card)' : 'transparent', color: psStrategy === 'mobile' ? 'var(--text-primary)' : 'var(--text-muted)', boxShadow: psStrategy === 'mobile' ? '0 2px 8px rgba(0,0,0,0.2)' : 'none', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        📱 Mobile
                      </button>
                      <button 
                        onClick={handleSelectDesktop}
                        style={{ padding: '8px 16px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, border: 'none', background: psStrategy === 'desktop' ? 'var(--bg-card)' : 'transparent', color: psStrategy === 'desktop' ? 'var(--text-primary)' : 'var(--text-muted)', boxShadow: psStrategy === 'desktop' ? '0 2px 8px rgba(0,0,0,0.2)' : 'none', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        💻 Desktop
                        {isFetchingDesktop && <RefreshCw size={12} className="spin" />}
                      </button>
                    </div>
                  </div>
                  
                  {psStrategy === 'desktop' && !r.pageSpeedDesktop && !isFetchingDesktop && !onUpdateResult && (
                    <div style={{ padding: '16px 24px 0' }}>
                      <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid var(--warning)', borderRadius: '8px', padding: '12px', color: 'var(--warning)', fontSize: '0.85rem' }}>
                        Dados de Desktop não disponíveis para esta análise antiga. Re-analise a URL para obter as métricas do computador. Exibindo dados Mobile.
                      </div>
                    </div>
                  )}

                  {psStrategy === 'desktop' && isFetchingDesktop && (
                    <div style={{ padding: '32px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid rgba(138,43,226,0.2)', borderTopColor: 'var(--accent-primary)', animation: 'loading 1s infinite linear', margin: '0 auto 16px' }} />
                      <p>Analisando desempenho para Desktop...</p>
                    </div>
                  )}

                  {!isFetchingDesktop && (
                    <>
                      <div style={{ display: 'flex', gap: '4px', padding: '16px 24px 0', flexWrap: 'wrap' }}>
                        {([
                          { key: 'overview', label: 'Visão Geral' },
                          { key: 'metrics', label: 'Métricas' },
                          { key: 'opportunities', label: 'Oportunidades' },
                          { key: 'resources', label: 'Recursos' },
                        ] as const).map(s => (
                          <button key={s.key} onClick={() => setPsSection(s.key)}
                            style={{ padding: '6px 14px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600,
                              background: psSection === s.key ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                              color: psSection === s.key ? 'white' : 'var(--text-secondary)',
                              transition: 'all 0.2s', marginBottom: '0' }}>
                            {s.label}
                          </button>
                        ))}
                      </div>

                      <div style={{ padding: '20px 24px' }}>
                    {psSection === 'overview' && (
                      <div>
                        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap', justifyContent: 'space-around' }}>
                          <CircleProgress score={currentPS.scores.performance} label="Desempenho" />
                          <CircleProgress score={currentPS.scores.accessibility} label="Acessibilidade" />
                          <CircleProgress score={currentPS.scores.bestPractices} label="Boas Práticas" />
                          <CircleProgress score={currentPS.scores.seo} label="SEO" />
                        </div>

                        <div style={{ background: 'var(--bg-app)', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Users size={14} /> Core Web Vitals
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                            {[
                              { label: 'LCP', m: currentPS.lcp },
                              { label: 'CLS', m: currentPS.cls },
                              { label: 'INP', m: currentPS.inp },
                            ].map(({ label, m }) => (
                              <div key={label} style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: getMetricColor(m.score) }}>{m.value}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>{label}</div>
                                {getMetricBadge(m.score)}
                              </div>
                            ))}
                          </div>
                        </div>

                        {currentPS.opportunities.length > 0 && (
                          <div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <TrendingUp size={14} /> Principais Oportunidades
                            </div>
                            {currentPS.opportunities.slice(0, 3).map(op => (
                              <OpportunityRow key={op.id} op={op} />
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {psSection === 'metrics' && (
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: 1.5 }}>
                          Dados de laboratório simulados com base em conexão 4G e hardware de celular mediano.
                        </div>
                        <MetricRow label="First Contentful Paint (FCP)" metric={currentPS.fcp} description="Quando o primeiro texto ou imagem é exibido. Bom: ≤ 1.8s" />
                        <MetricRow label="Largest Contentful Paint (LCP)" metric={currentPS.lcp} description="Quando o maior elemento visível é renderizado. Bom: ≤ 2.5s" />
                        <MetricRow label="Total Blocking Time (TBT)" metric={currentPS.tbt} description="Tempo total de bloqueio da thread principal. Bom: ≤ 200ms" />
                        <MetricRow label="Cumulative Layout Shift (CLS)" metric={currentPS.cls} description="Mede a instabilidade visual (elementos pulando na tela). Bom: ≤ 0.1" />
                        <MetricRow label="Speed Index" metric={currentPS.speedIndex} description="Com que rapidez o conteúdo é exibido. Bom: ≤ 3.4s" />
                        <MetricRow label="Interaction to Next Paint (INP)" metric={currentPS.inp} description="Responsividade a interações do usuário. Bom: ≤ 200ms" />
                        <MetricRow label="Time to First Byte (TTFB)" metric={currentPS.ttfb} description="Tempo até o servidor enviar o primeiro byte. Bom: ≤ 800ms" />
                      </div>
                    )}

                    {psSection === 'opportunities' && (
                      <div>
                        {currentPS.opportunities.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
                            <CheckCircle2 size={40} color="var(--success)" style={{ margin: '0 auto 12px', display: 'block' }} />
                            <p>Nenhuma oportunidade de melhoria encontrada!</p>
                          </div>
                        ) : (
                          <>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: 1.5 }}>
                              Estas sugestões destacam as otimizações mais impactantes para melhorar a performance.
                            </div>
                            {currentPS.opportunities.map(op => (
                              <OpportunityRow key={op.id} op={op} />
                            ))}
                          </>
                        )}
                        {currentPS.blockers.length > 0 && (
                          <div style={{ marginTop: '24px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', padding: '16px' }}>
                            <h5 style={{ fontSize: '0.85rem', color: 'var(--error)', marginBottom: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <AlertTriangle size={16} /> Bloqueadores Ativos
                            </h5>
                            <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {currentPS.blockers.map((b, i) => (
                                <li key={i} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{b}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {psSection === 'resources' && (
                      <div>
                        <div style={{ background: 'var(--bg-app)', borderRadius: '12px', padding: '16px', marginBottom: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                          <div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Requisições</div>
                            <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{currentPS.resources.totalRequests}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Tamanho Total</div>
                            <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{currentPS.resources.totalSize}</div>
                          </div>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Layers size={14} /> Distribuição por Tipo
                        </div>
                        <ResourceBar label="JavaScript" value={currentPS.resources.js} total={currentPS.resources.totalSize} color="#f59e0b" />
                        <ResourceBar label="Imagens" value={currentPS.resources.images} total={currentPS.resources.totalSize} color="#3b82f6" />
                        <ResourceBar label="CSS" value={currentPS.resources.css} total={currentPS.resources.totalSize} color="#8b5cf6" />
                        <ResourceBar label="Fontes" value={currentPS.resources.fonts} total={currentPS.resources.totalSize} color="#22c55e" />
                        <ResourceBar label="Outros" value={currentPS.resources.other} total={currentPS.resources.totalSize} color="#71717a" />
                      </div>
                    )}
                  </div>
                  </>
                  )}
                </>
              )}

              {activeTab === 'indexacao' && (
                <div style={{ padding: '20px 24px' }}>
                  <div style={{ marginBottom: '32px' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                      <CheckCircle2 size={14} /> Cobertura e Rastreamento
                    </div>
                    
                    <StatusRow label="Descoberta" isError={r.indexing.sitemapStatus !== 'in_sitemap'} 
                      okText="Encontrada no sitemap.xml" 
                      errorText="URL não está no sitemap.xml"
                      description="Indica se o Googlebot pode encontrar esta URL facilmente através dos seus arquivos de sitemap declarados." />

                    <StatusRow label="Rastreamento" isError={r.indexing.robotsBlocked} 
                      okText="Googlebot pode rastrear" 
                      errorText="Bloqueada pelo Robots.txt"
                      description="Indica se você deu permissão para o robô do Google ler o conteúdo desta página específica." />

                    <StatusRow label="Indexação" isError={r.indexing.noindex || r.indexing.redirectStatus !== 'ok'} 
                      okText="Indexação permitida" 
                      errorText={r.indexing.noindex ? 'Bloqueada por meta noindex' : 'Página com erro (Redirect/404)'}
                      description="Indica se a página atende aos requisitos técnicos básicos para ser salva no índice de busca do Google." />

                    <StatusRow label="Identidade (Canonical)" isError={r.indexing.canonicalStatus !== 'valid'} 
                      okText="URL canônica declarada corretamente" 
                      errorText="Problema na tag Canonical"
                      description="Verifica se a página se identifica como a versão original do conteúdo para evitar problemas de duplicidade." />
                  </div>

                  {r.criticalBottlenecks.length > 0 && r.criticalBottlenecks[0] !== 'Página em excelente estado técnico.' && (
                    <div style={{ marginTop: '24px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '10px', padding: '16px' }}>
                      <h5 style={{ fontSize: '0.85rem', color: 'var(--warning)', marginBottom: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <AlertTriangle size={16} /> O que o Google recomenda
                      </h5>
                      <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {r.criticalBottlenecks.map((b, i) => (
                          <li key={i} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{b}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <div style={{ marginTop: '24px', padding: '16px', background: 'var(--bg-app)', borderRadius: '10px', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                    <strong>Nota Didática:</strong> Se todos os itens acima estiverem verdes, a página está "saudável". Caso algum esteja vermelho, o Google terá dificuldade em exibir seu site para novos usuários.
                  </div>
                </div>
              )}
            
            {activeTab === 'ia' && (
              <div style={{ padding: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '24px', background: 'linear-gradient(145deg, rgba(34,197,94,0.05), rgba(0,0,0,0))', padding: '32px 24px', borderRadius: '12px', border: '1px solid rgba(34,197,94,0.1)' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(34,197,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', fontSize: '24px' }}>
                    🤖
                  </div>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Plano de Ação Automático</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '24px' }}>
                    Nosso algoritmo especialista vai analisar todos os gargalos técnicos e de indexação desta URL e te entregar um passo a passo prático de resolução.
                  </p>
                  
                  {!aiInsight && !isGeneratingAi && (
                    <button 
                      onClick={handleGenerateInsight}
                      style={{
                        background: 'var(--warning)',
                        color: '#000',
                        border: 'none',
                        padding: '12px 24px',
                        borderRadius: '8px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'transform 0.1s',
                        boxShadow: '0 4px 14px rgba(234, 179, 8, 0.4)'
                      }}
                      onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
                      onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      ⚡ Gerar Plano de Ação
                    </button>
                  )}

                  {isGeneratingAi && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: '3px solid rgba(234, 179, 8, 0.2)', borderTopColor: 'var(--warning)', animation: 'loading 1s infinite linear' }} />
                      <span style={{ fontSize: '0.85rem', color: 'var(--warning)', fontWeight: 600, animation: 'pulse 1.5s infinite' }}>O algoritmo está elaborando a estratégia...</span>
                    </div>
                  )}
                </div>

                {aiError && (
                  <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid var(--error)', padding: '16px', borderRadius: '8px', color: 'var(--error)', fontSize: '0.85rem', marginBottom: '24px' }}>
                    <strong>Erro:</strong> {aiError}
                  </div>
                )}

                {aiInsight && (
                  <div style={{ background: 'var(--bg-app)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: '-10px', right: '20px', background: 'var(--warning)', color: '#000', padding: '4px 12px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 800 }}>PLANO PRONTO</div>
                    {renderMarkdown(aiInsight)}
                  </div>
                )}
              </div>
            )}
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
};
