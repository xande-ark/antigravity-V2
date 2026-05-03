import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ProjectSidebar } from './components/ProjectSidebar';
import { AnalyzerInput } from './components/AnalyzerInput';
import { GlobalDashboard } from './components/GlobalDashboard';
import { ProjectTable } from './components/ProjectTable';
import { DetailDrawer } from './components/DetailDrawer';
import { CloudflareManager } from './components/CloudflareManager';
import type { Project, AnalysisResult, CrawlResult } from './types';
import { analyzeUrl } from './lib/analyzer';
import { crawlDomain } from './lib/crawler';
import { Plus, Activity, Globe, AlertTriangle, RefreshCcw, RefreshCw } from 'lucide-react';
import './App.css';

// Error Boundary Component
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: any}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', background: '#09090b', color: '#fafafa', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <AlertTriangle size={64} color="#ef4444" style={{ marginBottom: '24px' }} />
          <h1 style={{ fontSize: '2rem', marginBottom: '16px' }}>Algo deu errado na interface</h1>
          <p style={{ color: '#a1a1aa', maxWidth: '500px', marginBottom: '32px' }}>Ocorreu um erro inesperado. Tente limpar os dados locais se o problema persistir.</p>
          <div style={{ display: 'flex', gap: '16px' }}>
            <button onClick={() => window.location.reload()} style={{ padding: '12px 24px', background: '#3b82f6', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 600, cursor: 'pointer' }}>Recarregar Página</button>
            <button onClick={() => { localStorage.clear(); window.location.reload(); }} style={{ padding: '12px 24px', background: 'transparent', border: '1px solid #3f3f46', borderRadius: '8px', color: '#fafafa', fontWeight: 600, cursor: 'pointer' }}>Limpar Dados Locais</button>
          </div>
          <pre style={{ marginTop: '40px', padding: '16px', background: '#18181b', borderRadius: '8px', fontSize: '0.8rem', color: '#ef4444', textAlign: 'left', maxWidth: '800px', overflow: 'auto', border: '1px solid #27272a' }}>
            {this.state.error?.toString()}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

function AppContent() {
  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const saved = localStorage.getItem('antigravity_projects');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  
  const [resultsByProject, setResultsByProject] = useState<Record<string, AnalysisResult[]>>(() => {
    try {
      const saved = localStorage.getItem('antigravity_results');
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  const [activeView, setActiveView] = useState<string>('global_dashboard');
  const [selectedResult, setSelectedResult] = useState<AnalysisResult | null>(null);
  
  // Toast Notification System
  const [toasts, setToasts] = useState<{id: string, message: string, type: 'success' | 'error' | 'info'}[]>([]);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = uuidv4();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };
  const [quickCheckResults, setQuickCheckResults] = useState<AnalysisResult[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showInputForProject, setShowInputForProject] = useState<boolean>(false);
  const [targetProjectForQuickCheck, setTargetProjectForQuickCheck] = useState<string>('');

  useEffect(() => {
    try {
      localStorage.setItem('antigravity_projects', JSON.stringify(projects));
    } catch (e: any) {
      if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
        addToast('Espaço de armazenamento esgotado. Algumas alterações podem não ser salvas.', 'error');
      }
    }
  }, [projects]);

  useEffect(() => {
    try {
      localStorage.setItem('antigravity_results', JSON.stringify(resultsByProject));
    } catch (e: any) {
      if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
        addToast('Espaço de armazenamento esgotado. Não foi possível salvar novos resultados.', 'error');
      }
      console.error('Error saving data:', e);
    }
  }, [resultsByProject]);

  const handleCreateProject = (name: string) => {
    const newProject: Project = { 
      id: uuidv4(), 
      name, 
      createdAt: new Date().toISOString() 
    };
    
    setProjects(prev => [...prev, newProject]);
    setActiveView(newProject.id);
    setShowInputForProject(true);
  };

  const handleCrawlDomain = async (url: string, projectId?: string) => {
    const targetProject = projectId ? projects.find(p => p.id === projectId) : null;
    
    // Helper to normalize URLs for strict deduplication
    const normalizeUrl = (u: string) => u.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');

    if (projectId) {
      setResultsByProject(prev => ({
        ...prev,
        [projectId]: (prev[projectId] || []).map(r => normalizeUrl(r.url) === normalizeUrl(url) ? { ...r, isCrawling: true } : r)
      }));
    } else {
      setQuickCheckResults(prev => prev.map(r => normalizeUrl(r.url) === normalizeUrl(url) ? { ...r, isCrawling: true } : r));
    }

    try {
      const currentProjectUrls = projectId ? (resultsByProject[projectId] || []).map(r => r.url) : quickCheckResults.map(r => r.url);
      const result = await crawlDomain(url, { projectUrls: currentProjectUrls });
      if (projectId) {
        setResultsByProject(prev => ({
          ...prev,
          [projectId]: (prev[projectId] || []).map(r => 
            normalizeUrl(r.url) === normalizeUrl(url) ? { ...r, isCrawling: false, crawlData: result } : r
          )
        }));
      } else {
        setQuickCheckResults(prev => prev.map(r => normalizeUrl(r.url) === normalizeUrl(url) ? { ...r, isCrawling: false, crawlData: result } : r));
      }

      // Show result count but do NOT auto-trigger analysis (it was overwriting crawlData state)
      const validUrls = result.urls
        .filter(u => u.status === 'ok' && !u.inProject)
        .map(u => u.url)
        .slice(0, 20);

      if (validUrls.length > 0) {
        addToast(`Sitemap rastreado: ${result.urls.length} URLs encontradas (${validUrls.length} novas). Clique em "Analisar Subpáginas" para analisá-las.`, 'success');
      } else {
        addToast(`Rastreamento concluído: ${result.urls.length} URLs mapeadas no sitemap.`, 'info');
      }

    } catch (error) {
      console.error('Crawl error:', error);
      addToast('Erro ao rastrear sitemap. O site pode estar bloqueando a conexão.', 'error');
      if (projectId) {
        setResultsByProject(prev => ({
          ...prev,
          [projectId]: (prev[projectId] || []).map(r => normalizeUrl(r.url) === normalizeUrl(url) ? { ...r, isCrawling: false } : r)
        }));
      } else {
        setQuickCheckResults(prev => prev.map(r => normalizeUrl(r.url) === normalizeUrl(url) ? { ...r, isCrawling: false } : r));
      }
    }
  };

  const handleDeleteProject = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este projeto?')) {
      setProjects(prev => prev.filter(p => p.id !== id));
      setResultsByProject(prev => { const n = { ...prev }; delete n[id]; return n; });
      if (activeView === id) setActiveView('global_dashboard');
    }
  };

  const handleDeleteResult = (resultId: string, projectId?: string) => {
    const setter = projectId 
      ? (updater: (prev: AnalysisResult[]) => AnalysisResult[]) => setResultsByProject(prev => ({ ...prev, [projectId]: updater(prev[projectId] || []) }))
      : setQuickCheckResults;

    setter(prev => {
      const resultToDelete = prev.find(r => r.id === resultId);
      if (!resultToDelete) return prev;

      // If deleting a root URL, delete all its subpages too
      if (!resultToDelete.isSubpage) {
        const rootBase = resultToDelete.url.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
        return prev.filter(r => {
          if (r.id === resultId) return false;
          if (r.isSubpage) {
            const subBase = r.url.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '');
            return !subBase.startsWith(rootBase);
          }
          return true;
        });
      }

      return prev.filter(r => r.id !== resultId);
    });

    if (selectedResult?.id === resultId) setSelectedResult(null);
  };

  const handleAnalyze = async (urls: string[], includeSubpages: boolean, projectId?: string, isSubpage: boolean = false) => {
    setIsAnalyzing(true);
    setShowInputForProject(false);

    const targetSetter = projectId 
      ? (updater: (prev: AnalysisResult[]) => AnalysisResult[]) => setResultsByProject(prev => ({ ...prev, [projectId]: updater(prev[projectId] || []) }))
      : (updater: (prev: AnalysisResult[]) => AnalysisResult[]) => setQuickCheckResults(prev => updater(prev));

    const emptyPageSpeed = { lcp: {value:'',score:'good'}, cls: {value:'',score:'good'}, inp: {value:'',score:'good'}, blockers: [], scores: {performance:0,accessibility:0,bestPractices:0,seo:0}, fcp: {value:'',score:'good'}, ttfb: {value:'',score:'good'}, speedIndex: {value:'',score:'good'}, tbt: {value:'',score:'good'}, resources: {totalRequests:0,totalSize:'0',js:'0',css:'0',images:'0',fonts:'0',other:'0'}, opportunities: [] };
    const emptyIndexing = { isIndexed:false, noindex:false, canonicalStatus:'valid', robotsBlocked:false, redirectStatus:'ok', sitemapStatus:'not_in_sitemap' };
    const normalizeUrl = (u: string) => u.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');

    // Get snapshot of already-completed URLs to avoid re-analyzing them
    const currentResults = projectId ? (resultsByProject[projectId] || []) : quickCheckResults;
    const alreadyCompletedUrls = new Set(
      currentResults.filter(r => r.status === 'completed').map(r => normalizeUrl(r.url))
    );

    // Only queue URLs that are truly new or have errors (not already completed)
    const urlsToProcess = urls.filter(url => !alreadyCompletedUrls.has(normalizeUrl(url)));

    // Add new pending entries to state (only for URLs not already present at all)
    targetSetter(prev => {
      const existingUrls = new Set(prev.map(r => normalizeUrl(r.url)));
      const brandNewUrls = urlsToProcess.filter(url => !existingUrls.has(normalizeUrl(url)));
      
      const newPending = brandNewUrls.map(url => ({ 
        id: uuidv4(), url, isSubpage, status: 'analyzing' as const, 
        score: 0, pageSpeed: emptyPageSpeed, indexing: emptyIndexing, criticalBottlenecks: [] 
      } as AnalysisResult));

      // Mark only non-completed existing ones as analyzing (e.g. errored ones)
      return [
        ...newPending,
        ...prev.map(r => {
          const isTargeted = urlsToProcess.some(u => normalizeUrl(u) === normalizeUrl(r.url));
          if (!isTargeted) return r;
          if (r.status === 'completed') return r; // Never re-analyze already-completed URLs
          return { ...r, status: 'analyzing' as const };
        })
      ];
    });

    if (urlsToProcess.length === 0) {
      addToast('Todas as páginas do sitemap já foram analisadas.', 'info');
      setIsAnalyzing(false);
      return;
    }

    addToast(`Analisando ${urlsToProcess.length} páginas novas...`, 'info');

    // Process URLs in parallel with a continuous concurrency pool
    const CONCURRENCY_LIMIT = 10;
    const queue = [...urlsToProcess];
    let activeCount = 0;

    const processNext = async () => {
      if (queue.length === 0) return;
      
      const url = queue.shift()!;
      activeCount++;

      try {
        const result = await analyzeUrl(url, isSubpage);
        // Preserve the original isSubpage flag — do NOT overwrite it with the parameter
        targetSetter(prev => prev.map(r => normalizeUrl(r.url) === normalizeUrl(url) ? { ...result, id: r.id, isSubpage: r.isSubpage } : r));
        
        if (includeSubpages) {
          handleCrawlDomain(url, projectId);
        }
      } catch (error) {
        console.error(`Error analyzing ${url}:`, error);
        targetSetter(prev => prev.map(r => normalizeUrl(r.url) === normalizeUrl(url) ? { ...r, status: 'error' } : r));
        addToast(`Falha ao analisar: ${url}`, 'error');
      } finally {
        activeCount--;
        await processNext();
      }
    };

    // Start initial workers
    const workers = [];
    for (let i = 0; i < Math.min(urlsToProcess.length, CONCURRENCY_LIMIT); i++) {
      workers.push(processNext());
    }

    await Promise.all(workers);
    setIsAnalyzing(false);
  };

  const handleReanalyze = async (result: AnalysisResult, projectId?: string) => {
    const updater = (prev: AnalysisResult[]) => prev.map(r => r.id === result.id ? { ...r, status: 'analyzing' as const } : r);
    if (projectId) {
      setResultsByProject(prev => ({ ...prev, [projectId]: updater(prev[projectId] || []) }));
    } else {
      setQuickCheckResults(prev => updater(prev));
    }

    try {
      const newResult = await analyzeUrl(result.url, result.isSubpage);
      newResult.id = result.id;
      const finalUpdater = (prev: AnalysisResult[]) => prev.map(r => r.id === result.id ? newResult : r);
      if (projectId) {
        setResultsByProject(prev => ({ ...prev, [projectId]: finalUpdater(prev[projectId] || []) }));
      } else {
        setQuickCheckResults(prev => finalUpdater(prev));
      }
      if (selectedResult?.id === result.id) setSelectedResult(newResult);
    } catch (e) {
      console.error('Reanalyze error:', e);
      const errorUpdater = (prev: AnalysisResult[]) => prev.map(r => r.id === result.id ? { ...r, status: 'error' } : r);
      if (projectId) setResultsByProject(prev => ({ ...prev, [projectId]: errorUpdater(prev[projectId] || []) }));
      else setQuickCheckResults(prev => errorUpdater(prev));
    }
  };

  const urlCounts = projects.reduce((acc, p) => { acc[p.id] = (resultsByProject[p.id] || []).length; return acc; }, {} as Record<string, number>);
  const activeProject = projects.find(p => p.id === activeView);
  const activeResults = activeProject ? (resultsByProject[activeProject.id] || []) : [];

  const getProjectStats = () => {
    const completed = activeResults.filter(r => r.status === 'completed');
    const avgScore = completed.length > 0 ? Math.round(completed.reduce((acc, r) => acc + r.score, 0) / completed.length) : 0;
    const bottlenecksCount = completed.flatMap(r => r.criticalBottlenecks).length;
    return { avgScore, bottlenecksCount, totalUrls: completed.length };
  };
  const { avgScore, bottlenecksCount, totalUrls } = getProjectStats();

  const renderGlobalView = () => {
    if (activeView === 'global_dashboard') {
      return (
        <GlobalDashboard 
          projects={projects} resultsByProject={resultsByProject}
          onDeleteProject={handleDeleteProject}
          onViewDetails={(id) => setActiveView(id)}
        />
      );
    }
    if (activeView === 'quick_check') {
      return (
        <div style={{ padding: '32px' }}>
          <h1 style={{ marginBottom: '24px' }}>Quick Check</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>Analise qualquer URL instantaneamente sem precisar criar um projeto.</p>
          <AnalyzerInput onAnalyze={(urls, sub) => handleAnalyze(urls, sub)} isAnalyzing={isAnalyzing} />
          {quickCheckResults.length > 0 && (
            <div style={{ marginTop: '48px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '1.2rem' }}>Resultados Recentes</h2>
                <button onClick={() => setQuickCheckResults([])} style={{ color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}>Limpar tudo</button>
              </div>
              <ProjectTable 
                project={{ id: 'temp', name: 'Quick Check', description: '', createdAt: '' } as any} 
                results={quickCheckResults}
                onDeleteProject={() => {}}
                onViewDetails={() => {}}
                onSelectResult={(r) => setSelectedResult(r)}
                onCrawl={(url) => handleCrawlDomain(url)}
                onDeleteResult={(id) => handleDeleteResult(id)}
                onAnalyzeSubpages={(urls) => handleAnalyze(urls, false)}
                onReanalyze={(r) => handleReanalyze(r)}
              />
            </div>
          )}
        </div>
      );
    }
    if (activeView === 'global_indexacao') {
      const allResults = Object.values(resultsByProject).flat();
      return (
        <div style={{ padding: '32px' }}>
          <h1 style={{ marginBottom: '8px' }}>Monitor de Indexação</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>Visão consolidada de todas as URLs em todos os projetos.</p>
          <ProjectTable 
            project={{ id: 'global_idx', name: 'Todas as URLs', createdAt: '' } as any} 
            results={allResults}
            onSelectResult={(r) => setSelectedResult(r)}
            onReanalyze={(r) => handleReanalyze(r, Object.keys(resultsByProject).find(id => resultsByProject[id].some(res => res.id === r.id)))}
          />
        </div>
      );
    }
    if (activeView === 'global_pagespeed') {
      const allResults = Object.values(resultsByProject).flat();
      return (
        <div style={{ padding: '32px' }}>
          <h1 style={{ marginBottom: '8px' }}>Core Web Vitals</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>Monitoramento de performance de todos os projetos ativos.</p>
          <ProjectTable 
            project={{ id: 'global_ps', name: 'Métricas de Performance', createdAt: '' } as any} 
            results={allResults}
            onSelectResult={(r) => setSelectedResult(r)}
            onReanalyze={(r) => handleReanalyze(r, Object.keys(resultsByProject).find(id => resultsByProject[id].some(res => res.id === r.id)))}
          />
        </div>
      );
    }
    if (activeView === 'cloudflare') {
      return (
        <div style={{ padding: '32px' }}>
          <CloudflareManager />
        </div>
      );
    }
    return null;
  };

  return (
    <div className="app-container">
      <ProjectSidebar
        projects={projects} activeView={activeView}
        onChangeView={(v) => { setActiveView(v); setShowInputForProject(false); setSelectedResult(null); }}
        onCreateProject={handleCreateProject}
        onDeleteProject={handleDeleteProject}
        urlCounts={urlCounts}
      />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        {activeProject ? (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <div style={{ background: 'var(--bg-sidebar)', borderBottom: '1px solid var(--border-color)', padding: '32px 40px 0' }}>
              <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 700 }}>Projeto Ativo</span>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '4px 0 0', letterSpacing: '-0.5px' }}>{activeProject.name}</h1>
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    {activeResults.length > 0 && (
                      <button 
                        onClick={() => handleAnalyze(activeResults.map(r => r.url), false, activeProject.id)}
                        disabled={isAnalyzing}
                        style={{ background: 'transparent', border: '1px solid var(--accent-primary)', color: 'var(--accent-primary)', padding: '10px 20px', borderRadius: '8px', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                      >
                        <RefreshCw size={18} className={isAnalyzing ? 'spin' : ''} /> RE-ANALISAR TUDO
                      </button>
                    )}
                    <button 
                      onClick={() => setShowInputForProject(!showInputForProject)}
                      className="btn-primary"
                    >
                      <Plus size={20} /> Adicionar URLs
                    </button>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2px', background: 'var(--border-color)', borderTop: '1px solid var(--border-color)', borderLeft: '1px solid var(--border-color)', borderRight: '1px solid var(--border-color)', borderRadius: '12px 12px 0 0', overflow: 'hidden' }}>
                  {[
                    { label: 'Score de Performance', value: avgScore || '—', color: avgScore >= 90 ? 'var(--success)' : avgScore >= 50 ? 'var(--warning)' : avgScore > 0 ? 'var(--error)' : 'var(--text-muted)', sub: avgScore >= 90 ? 'Excelente' : avgScore >= 50 ? 'Precisa melhorar' : avgScore > 0 ? 'Crítico' : 'Sem dados' },
                    { label: 'Analisadas', value: totalUrls, color: 'var(--info)', sub: 'URLs concluídas' },
                    { label: 'Em Progresso', value: activeResults.filter(r => r.status === 'analyzing').length, color: 'var(--warning)', sub: 'aguardando API' },
                    { label: 'Indexadas', value: activeResults.filter(r => r.status === 'completed' && r.indexing.isIndexed).length, color: 'var(--success)', sub: `de ${totalUrls} concluídas` },
                  ].map((stat, i) => (
                    <div key={i} style={{ background: 'var(--bg-app)', padding: '20px 24px', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: stat.color }} />
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '10px' }}>{stat.label}</div>
                      <div style={{ fontSize: '2rem', fontWeight: 900, color: stat.color, lineHeight: 1, marginBottom: '6px' }}>{stat.value}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{stat.sub}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ padding: '32px 40px' }}>
              <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                {showInputForProject && (
                  <div style={{ marginBottom: '32px' }}>
                    <AnalyzerInput onAnalyze={(urls, sub) => handleAnalyze(urls, sub, activeProject.id, false)} isAnalyzing={isAnalyzing} />
                  </div>
                )}
                {isAnalyzing && !showInputForProject && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px 24px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', marginBottom: '32px' }}>
                    <div style={{ width: '32px', height: '32px', border: '3px solid var(--accent-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '2px' }}>Analisando URLs...</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Você pode navegar para outras seções enquanto aguarda.</div>
                    </div>
                  </div>
                )}
                <ProjectTable
                  project={activeProject}
                  results={activeResults}
                  onDeleteProject={handleDeleteProject}
                  onViewDetails={() => {}}
                  onSelectResult={(r) => setSelectedResult(r)}
                  onCrawl={(url) => handleCrawlDomain(url, activeProject.id)}
                  onDeleteResult={(id) => handleDeleteResult(id, activeProject.id)}
                  onAnalyzeSubpages={(urls) => handleAnalyze(urls, false, activeProject.id, true)}
                  onReanalyze={(r) => handleReanalyze(r, activeProject.id)}
                />
              </div>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {renderGlobalView()}
          </div>
        )}
      </main>
      <DetailDrawer result={selectedResult} onClose={() => setSelectedResult(null)} />
      
      {/* Toast Container */}
      <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {toasts.map(toast => (
          <div key={toast.id} style={{ 
            background: 'var(--bg-card)', 
            border: `1px solid var(--${toast.type === 'error' ? 'error' : toast.type === 'success' ? 'success' : 'accent-primary'})`, 
            color: 'white', 
            padding: '12px 20px', 
            borderRadius: '8px', 
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            animation: 'slideIn 0.3s ease-out forwards',
            fontSize: '0.85rem',
            fontWeight: 500
          }}>
            {toast.type === 'success' && <div style={{ color: 'var(--success)' }}>✓</div>}
            {toast.type === 'error' && <div style={{ color: 'var(--error)' }}>⚠</div>}
            {toast.type === 'info' && <div style={{ color: 'var(--accent-primary)' }}>ℹ</div>}
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
