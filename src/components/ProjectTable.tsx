import React, { useState } from 'react';
import { 
  ChevronRight, ChevronDown, AlertCircle, 
  ExternalLink, Trash2, ScanSearch, RefreshCw
} from 'lucide-react';
import type { Project, AnalysisResult, CrawlResult } from '../types';

interface ProjectTableProps {
  project?: Project;
  results: AnalysisResult[];
  onDeleteProject?: (id: string) => void;
  onViewDetails?: (id: string) => void;
  onSelectResult?: (result: AnalysisResult) => void;
  onCrawl?: (url: string) => void;
  onDeleteResult?: (id: string) => void;
  onAnalyzeSubpages?: (urls: string[]) => void;
  onReanalyze?: (result: AnalysisResult) => void;
}

export function ProjectTable({ 
  results, 
  onSelectResult,
  onCrawl,
  onDeleteResult,
  onAnalyzeSubpages,
  onReanalyze
}: ProjectTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) newExpanded.delete(id);
    else newExpanded.add(id);
    setExpandedRows(newExpanded);
  };

  const getPageSpeedColor = (score: number) => {
    if (score >= 90) return 'var(--success)';
    if (score >= 50) return 'var(--warning)';
    return 'var(--error)';
  };

  const getLCPColor = (valueStr: string) => {
    const val = parseFloat(valueStr.replace(/[^\d.]/g, ''));
    if (isNaN(val)) return 'var(--text-secondary)';
    if (val <= 2.5) return 'var(--success)';
    if (val <= 4.0) return 'var(--warning)';
    return 'var(--error)';
  };

  const getCLSColor = (valueStr: string) => {
    const val = parseFloat(valueStr.replace(/[^\d.]/g, ''));
    if (isNaN(val)) return 'var(--text-secondary)';
    if (val <= 0.1) return 'var(--success)';
    if (val <= 0.25) return 'var(--warning)';
    return 'var(--error)';
  };

  const normalizeUrl = (url: string) => {
    return url.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
  };

  // Group results by root domain (only for top-level results)
  const rootResults = results.filter(r => !r.isSubpage);

  return (
    <div className="table-container" style={{ overflow: 'visible' }}>
      <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', paddingLeft: '48px' }}>URL</th>
            <th style={{ textAlign: 'center' }}>INDEXAÇÃO</th>
            <th style={{ textAlign: 'center' }}>PAGESPEED</th>
            <th style={{ textAlign: 'left' }}>LCP</th>
            <th style={{ textAlign: 'left' }}>CLS</th>
            <th style={{ textAlign: 'right' }}>AÇÕES</th>
          </tr>
        </thead>
        <tbody>
          {rootResults.length === 0 && (
            <tr>
              <td colSpan={6} style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', background: 'rgba(255,255,255,0.02)', padding: '40px', borderRadius: '16px', border: '1px dashed var(--border-color)', maxWidth: '400px', margin: '0 auto' }}>
                  <div style={{ background: 'var(--bg-app)', padding: '16px', borderRadius: '50%', boxShadow: '0 0 20px rgba(0,0,0,0.2)' }}>
                    <AlertCircle size={32} style={{ color: 'var(--accent-primary)' }} />
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '1.1rem', color: 'var(--text-primary)' }}>Nenhuma URL analisada ainda</div>
                  <div style={{ fontSize: '0.85rem', lineHeight: 1.5 }}>Clique em "Adicionar URLs" acima ou rastreie um sitemap para começar a monitorar este projeto.</div>
                </div>
              </td>
            </tr>
          )}

          {rootResults.map((result) => {
            const isExpanded = expandedRows.has(result.id);
            const normalizedRoot = normalizeUrl(result.url);
            const childResults = results.filter(r => r.isSubpage && normalizeUrl(r.url).startsWith(normalizedRoot) && normalizeUrl(r.url) !== normalizedRoot);
            const hasSubpages = childResults.length > 0;

            const renderRow = (res: AnalysisResult, isChild: boolean) => {
              const rHovered = hoveredRow === res.id;
              const isIndexing = res.status === 'analyzing';
              
              // Check if this URL was found as 404 in a parent's crawl data
              const parentCrawlData = results
                .filter(r => !r.isSubpage && r.crawlData)
                .map(r => r.crawlData as CrawlResult)
                .find(cd => cd.urls.some(u => u.url === res.url));
              const crawlEntry = parentCrawlData?.urls.find(u => u.url === res.url);
              const is404FromCrawl = crawlEntry?.httpCode === 404 || crawlEntry?.httpCode === 410;
              const is404FromAnalyzer = res.indexing?.redirectStatus === '404';
              const is404 = is404FromCrawl || is404FromAnalyzer;

              let indexingBadge = 'warning';
              let indexingText = 'PENDENTE';

              if (is404) {
                indexingBadge = 'error';
                indexingText = 'ERRO 404';
              } else if (res.indexing.isIndexed) {
                indexingBadge = 'success';
                indexingText = 'INDEXADO';
              } else if (res.indexing.noindex) {
                indexingBadge = 'error';
                indexingText = 'NOINDEX';
              } else if (res.status === 'completed') {
                indexingBadge = 'warning';
                indexingText = 'AGUARDANDO GOOGLE';
              }

            return (
              <tr
                key={res.id}
                onMouseEnter={() => setHoveredRow(res.id)}
                onMouseLeave={() => setHoveredRow(null)}
                className={`hover-magnetic ${!isChild ? 'animate-fade-in-up' : ''}`}
                style={{
                  background: rHovered ? 'var(--bg-tertiary)' : (isChild ? 'var(--bg-app)' : 'transparent')
                }}
              >
                  <td style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: isChild ? '48px' : '16px', minHeight: '60px' }}>
                    {!isChild && (
                      <button
                        onClick={(e) => toggleExpand(res.id, e)}
                        style={{ 
                          background: 'transparent', border: 'none', color: 'var(--text-muted)', 
                          cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', 
                          justifyContent: 'center', visibility: (hasSubpages || res.isCrawling) ? 'visible' : 'hidden'
                        }}
                      >
                        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      </button>
                    )}
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'nowrap', overflow: 'hidden' }}>
                      <span
                        onClick={() => onSelectResult && onSelectResult(res)}
                        style={{ 
                          color: 'var(--text-muted)', 
                          transition: 'color 0.15s', cursor: 'pointer', 
                          fontSize: isChild ? '0.82rem' : '0.9rem',
                          fontWeight: 500,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: isChild ? '300px' : '400px'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.color = 'var(--accent-primary)'}
                        onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                      >
                        {isChild ? res.url.replace(/^https?:\/\/[^/]+/, '') : res.url}
                      </span>

                      {res.source === 'Google PageSpeed API' && (
                        <span style={{ fontSize: '0.6rem', padding: '1px 5px', borderRadius: '4px', background: 'rgba(34,197,94,0.1)', color: 'var(--success)', border: '1px solid rgba(34,197,94,0.3)', fontWeight: 700, flexShrink: 0 }}>
                          REAL
                        </span>
                      )}
                    </div>
                  </td>

                  <td style={{ textAlign: 'center' }}>
                    {isIndexing ? (
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, animation: 'pulse-subtle 1.5s infinite' }}>Verificando...</span>
                    ) : (
                    <span 
                      className={`badge ${indexingBadge}`} 
                      style={{ 
                        fontSize: '0.7rem', 
                        fontWeight: 800, 
                        cursor: 'pointer',
                        userSelect: 'none',
                        transition: 'transform 0.1s'
                      }}
                      onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
                      onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      onClick={(e) => {
                        e.stopPropagation();
                        const updated = { ...res, indexing: { ...res.indexing, isIndexed: !res.indexing.isIndexed } };
                        onReanalyze?.(updated); // This triggers an update in the parent state
                      }}
                      title="Clique para alternar status de indexação"
                    >
                      {indexingText}
                    </span>
                    )}
                  </td>

                  <td style={{ textAlign: 'center' }}>
                    {isIndexing ? (
                      <div style={{ width: '40px', height: '4px', background: 'var(--border-color)', borderRadius: '2px', margin: '0 auto', overflow: 'hidden' }}>
                        <div style={{ width: '50%', height: '100%', background: 'var(--accent-primary)', animation: 'loading 1s infinite linear' }} />
                      </div>
                    ) : (
                      <span style={{ fontWeight: 800, color: getPageSpeedColor(res.score) }}>{res.score}</span>
                    )}
                  </td>

                  <td style={{ fontSize: '0.85rem', color: isIndexing ? 'var(--text-secondary)' : getLCPColor(res.pageSpeed.lcp.value), fontWeight: isIndexing ? 400 : 700 }}>
                    {isIndexing ? '...' : res.pageSpeed.lcp.value || '—'}
                  </td>
                  
                  <td style={{ fontSize: '0.85rem', color: isIndexing ? 'var(--text-secondary)' : getCLSColor(res.pageSpeed.cls.value), fontWeight: isIndexing ? 400 : 700 }}>
                    {isIndexing ? '...' : res.pageSpeed.cls.value || '—'}
                  </td>

                  <td style={{ textAlign: 'right', paddingRight: '16px' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', opacity: isIndexing ? 0.6 : 1 }}>
                      {!isIndexing && (
                        <>
                          {res.status === 'completed' && (
                            <button 
                              onClick={() => onSelectResult && onSelectResult(res)}
                              className="btn-hover-effect"
                              style={{ 
                                padding: '6px 12px', fontSize: '0.75rem', fontWeight: 700, 
                                borderRadius: '6px', cursor: 'pointer',
                                background: 'var(--accent-primary)', color: 'white',
                                border: 'none'
                              }}
                            >
                              Ver detalhes
                            </button>
                          )}
                          
                          {onReanalyze && res.status === 'completed' && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); onReanalyze(res); }}
                              className="btn-hover-effect"
                              style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)', padding: '6px', borderRadius: '6px', cursor: 'pointer' }}
                              title="Re-analisar"
                            >
                              <RefreshCw size={14} />
                            </button>
                          )}

                          {!isChild && onCrawl && (
                            <button
                              onClick={(e) => { e.stopPropagation(); onCrawl(res.url); setExpandedRows(prev => new Set(prev).add(res.id)); }}
                              className="btn-hover-effect"
                              style={{ 
                                background: res.crawlData ? 'transparent' : 'var(--accent-glow)', 
                                border: '1px solid var(--accent-primary)', 
                                color: 'var(--accent-primary)', 
                                padding: '6px 12px', borderRadius: '6px', 
                                fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', 
                                display: 'flex', alignItems: 'center', gap: '6px' 
                              }}
                              title={res.crawlData ? "Atualizar sitemap" : "Rastrear sitemap"}
                            >
                              <ScanSearch size={14} /> {res.crawlData ? 'Atualizar' : 'Rastrear'}
                            </button>
                          )}

                          {onDeleteResult && rHovered && (
                            <button
                              onClick={(e) => { e.stopPropagation(); onDeleteResult(res.id); }}
                              style={{ background: 'transparent', border: '1px solid var(--error)', color: 'var(--error)', padding: '6px', borderRadius: '6px', cursor: 'pointer' }}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </>
                      )}
                      {isIndexing && <RefreshCw size={14} className="spin" style={{ color: 'var(--text-muted)' }} />}
                    </div>
                  </td>
                </tr>
              );
            };

            return (
              <React.Fragment key={result.id}>
                {renderRow(result, false)}
                
                {isExpanded && (
                  <>
                    {childResults.map(child => renderRow(child, true))}
                    
                    {result.isCrawling && (
                      <tr key={`${result.id}-crawling`}>
                        <td colSpan={6} style={{ padding: '20px 48px', background: 'rgba(59,130,246,0.05)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <RefreshCw size={16} className="spin" style={{ color: 'var(--accent-primary)' }} />
                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-primary)' }}>Rastreando sitemap...</span>
                          </div>
                        </td>
                      </tr>
                    )}

                    {/* Crawl result panel — shown right below the row */}
                    {result.crawlData && (() => {
                      const cd = result.crawlData as CrawlResult;
                      const broken = cd.urls.filter(u => (u.httpCode ?? 0) === 404 || (u.httpCode ?? 0) === 410);
                      const redirects = cd.urls.filter(u => (u.httpCode ?? 0) >= 300 && (u.httpCode ?? 0) < 400);
                      const ok = cd.urls.filter(u => (u.httpCode ?? 0) === 200);
                      const newUrls = cd.urls.filter(u => (u.httpCode ?? 0) === 200 || u.status === 'ok');
                      return (
                        <tr key={`${result.id}-crawldata`}>
                          <td colSpan={6} style={{ padding: '0 16px 16px 48px', background: 'var(--bg-app)' }}>
                            <div style={{ border: '1px solid var(--border-color)', borderRadius: '10px', overflow: 'hidden' }}>
                              {/* Summary + action bar */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 16px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)', flexWrap: 'wrap' }}>
                                <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.85rem' }}>📋 Sitemap: {cd.urls.length} URLs</span>
                                <span style={{ color: 'var(--success)', fontWeight: 700, fontSize: '0.8rem' }}>✓ {ok.length} OK</span>
                                {redirects.length > 0 && <span style={{ color: 'var(--warning)', fontWeight: 700, fontSize: '0.8rem' }}>↪ {redirects.length} Redir.</span>}
                                {broken.length > 0 && <span style={{ color: 'var(--error)', fontWeight: 700, fontSize: '0.8rem' }}>✗ {broken.length} Erros</span>}
                                {onAnalyzeSubpages && newUrls.length > 0 && (
                                  <button
                                    onClick={() => onAnalyzeSubpages(newUrls.map(u => u.url))}
                                    style={{ marginLeft: 'auto', padding: '6px 14px', background: 'linear-gradient(135deg, #a855f7, #8b5cf6)', border: 'none', borderRadius: '6px', color: 'white', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}
                                  >
                                    🔍 Analisar todas as {newUrls.length} páginas
                                  </button>
                                )}
                              </div>

                              {/* 404 list */}
                              {broken.length > 0 && (
                                <div style={{ padding: '8px 0' }}>
                                  <div style={{ padding: '6px 16px', fontSize: '0.7rem', fontWeight: 800, color: 'var(--error)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Páginas com Erro</div>
                                  {broken.map(u => (
                                    <div key={u.url} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 16px', borderBottom: '1px solid var(--border-color)' }}>
                                      <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', background: 'rgba(239,68,68,0.15)', color: 'var(--error)', flexShrink: 0 }}>{u.httpCode}</span>
                                      <a href={u.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8rem', color: 'var(--error)', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{u.url}</a>
                                      <ExternalLink size={11} style={{ color: 'var(--error)', flexShrink: 0 }} />
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Redirects */}
                              {redirects.length > 0 && (
                                <div style={{ padding: '8px 0' }}>
                                  <div style={{ padding: '6px 16px', fontSize: '0.7rem', fontWeight: 800, color: 'var(--warning)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Redirecionamentos</div>
                                  {redirects.map(u => (
                                    <div key={u.url} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 16px', borderBottom: '1px solid var(--border-color)' }}>
                                      <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', background: 'rgba(234,179,8,0.15)', color: 'var(--warning)', flexShrink: 0 }}>{u.httpCode}</span>
                                      <a href={u.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.url}</a>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* OK summary */}
                              {ok.length > 0 && (
                                <div style={{ padding: '8px 16px', fontSize: '0.78rem', color: 'var(--text-muted)', borderTop: broken.length > 0 || redirects.length > 0 ? '1px solid var(--border-color)' : 'none' }}>
                                  + {ok.length} páginas funcionando corretamente
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })()}
                  </>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
