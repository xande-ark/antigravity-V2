import React, { useState } from 'react';
import type { AnalysisResult, Metric } from '../types';
import { CheckCircle2, AlertTriangle, XCircle, Zap, Search, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  result: AnalysisResult;
}

const getScoreColor = (score: number) => {
  if (score >= 90) return 'var(--success)';
  if (score >= 50) return 'var(--warning)';
  return 'var(--error)';
};

const MetricBadge = ({ metric, label, description }: { metric: Metric; label: string, description: string }) => {
  const color = 
    metric.score === 'good' ? 'var(--success)' : 
    metric.score === 'needs-improvement' ? 'var(--warning)' : 'var(--error)';
    
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--bg-tertiary)', padding: '16px', borderRadius: '8px', borderLeft: `4px solid ${color}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: 700 }}>{label}</span>
        <span style={{ fontSize: '1.25rem', fontWeight: 800, color }}>{metric.value}</span>
      </div>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{description}</p>
    </div>
  );
};

const StatusRow = ({ label, description, okText, errorText, isError }: { label: string, description: string, okText: string, errorText: string, isError: boolean }) => {
  const color = isError ? 'var(--error)' : 'var(--success)';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--bg-tertiary)', padding: '16px', borderRadius: '8px', borderLeft: `4px solid ${color}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 600 }}>{label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color, fontWeight: 600, fontSize: '0.9rem' }}>
          {isError ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
          {isError ? errorText : okText}
        </div>
      </div>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{description}</p>
    </div>
  );
};

export const ResultCard: React.FC<Props> = ({ result }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'geral' | 'pagespeed' | 'indexacao'>('geral');

  if (result.status === 'analyzing') {
    return (
      <div className="card" style={{ marginBottom: '16px', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '24px', height: '24px', border: '2px solid var(--accent-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <span style={{ color: 'var(--text-secondary)' }}>Analisando {result.url}...</span>
        </div>
      </div>
    );
  }

  const { pageSpeed, indexing, criticalBottlenecks } = result;
  
  return (
    <div className="card" style={{ marginBottom: '16px', padding: 0, overflow: 'hidden' }}>
      
      {/* HEADER DA LISTA (SEMPRE VISÍVEL) */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ 
          padding: '20px 24px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          cursor: 'pointer',
          background: isExpanded ? 'var(--bg-tertiary)' : 'transparent',
          transition: 'background 0.2s ease'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ 
            width: '48px', height: '48px', 
            borderRadius: '50%', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: '1.2rem',
            background: 'var(--bg-primary)',
            color: getScoreColor(result.score),
            border: `2px solid ${getScoreColor(result.score)}`
          }}>
            {result.score}
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              {result.url}
              {result.isSubpage && <span style={{ fontSize: '0.7rem', background: 'var(--bg-primary)', padding: '2px 8px', borderRadius: '12px', color: 'var(--text-secondary)' }}>Subpágina</span>}
            </h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {criticalBottlenecks.length} gargalos encontrados
            </span>
          </div>
        </div>
        
        <div style={{ color: 'var(--text-muted)' }}>
          {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
        </div>
      </div>

      {/* CONTEÚDO EXPANDIDO */}
      {isExpanded && (
        <div style={{ borderTop: '1px solid var(--border-color)' }}>
          
          {/* TABS */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-primary)' }}>
            <button 
              onClick={() => setActiveTab('geral')}
              style={{ flex: 1, padding: '16px', fontWeight: 600, borderBottom: activeTab === 'geral' ? '2px solid var(--accent-primary)' : '2px solid transparent', color: activeTab === 'geral' ? 'var(--accent-primary)' : 'var(--text-secondary)' }}
            >
              Gargalos Críticos
            </button>
            <button 
              onClick={() => setActiveTab('pagespeed')}
              style={{ flex: 1, padding: '16px', fontWeight: 600, borderBottom: activeTab === 'pagespeed' ? '2px solid var(--accent-primary)' : '2px solid transparent', color: activeTab === 'pagespeed' ? 'var(--accent-primary)' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <Zap size={16} /> PageSpeed
            </button>
            <button 
              onClick={() => setActiveTab('indexacao')}
              style={{ flex: 1, padding: '16px', fontWeight: 600, borderBottom: activeTab === 'indexacao' ? '2px solid var(--accent-primary)' : '2px solid transparent', color: activeTab === 'indexacao' ? 'var(--accent-primary)' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <Search size={16} /> Indexação
            </button>
          </div>

          {/* TAB CONTENT */}
          <div style={{ padding: '24px' }}>
            
            {activeTab === 'geral' && (
              <div>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--warning)' }}>
                  <AlertTriangle size={20} />
                  Plano de Ação Imediato
                </h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
                  Abaixo estão os problemas mais urgentes detectados nesta URL que estão impedindo um bom ranqueamento ou performance.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {criticalBottlenecks.map((bottleneck, idx) => (
                    <div key={idx} style={{ background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.2)', padding: '16px', borderRadius: '8px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <AlertTriangle size={18} color="var(--warning)" style={{ marginTop: '2px', flexShrink: 0 }} />
                      <span style={{ color: 'var(--text-primary)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                        {bottleneck}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'pagespeed' && (
              <div>
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ fontSize: '1.2rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    Core Web Vitals
                  </h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Métricas oficias do Google que medem a experiência real do usuário. Elas afetam diretamente a sua nota de SEO.
                  </p>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                  <MetricBadge 
                    label="LCP (Largest Contentful Paint)" 
                    metric={pageSpeed.lcp} 
                    description="Mede o tempo até o elemento visual mais pesado da tela (geralmente uma imagem ou banner) ser carregado. Ideal: Menor que 2.5s."
                  />
                  <MetricBadge 
                    label="CLS (Cumulative Layout Shift)" 
                    metric={pageSpeed.cls} 
                    description="Mede a estabilidade visual. Elementos pulando na tela enquanto a página carrega prejudicam o usuário. Ideal: Menor que 0.1."
                  />
                  <MetricBadge 
                    label="INP (Interaction to Next Paint)" 
                    metric={pageSpeed.inp} 
                    description="Mede a responsividade geral da página a cliques do usuário (o quão 'travada' a página está devido ao processamento JS). Ideal: Menor que 200ms."
                  />
                </div>

                {pageSpeed.blockers.length > 0 && (
                  <div>
                    <h5 style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>Principais Ofensores de Performance:</h5>
                    <ul style={{ paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      {pageSpeed.blockers.map((b, i) => <li key={i}>{b}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'indexacao' && (
              <div>
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ fontSize: '1.2rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    Fatores de Rastreamento (Crawling)
                  </h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Avaliação técnica sobre como os robôs de busca (Googlebot) enxergam e indexam esta página.
                  </p>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '16px' }}>
                  
                  <StatusRow 
                    label="Tag Canonical"
                    isError={indexing.canonicalStatus !== 'valid'}
                    okText="Tag válida"
                    errorText="Conflito ou Ausente"
                    description="A tag Canonical diz ao Google qual é a URL principal (original). Se estiver errada, o Google pode considerar a página como conteúdo duplicado e não listá-la."
                  />

                  <StatusRow 
                    label="Diretiva Noindex"
                    isError={indexing.noindex}
                    okText="Ausente (Pode ser indexada)"
                    errorText="Detectado (Bloqueia indexação)"
                    description="A tag 'noindex' instrui explicitamente o Google a remover ou não incluir a página em seus resultados. Se esta página deve receber tráfego, isso é um erro crítico."
                  />

                  <StatusRow 
                    label="Robots.txt"
                    isError={indexing.robotsBlocked}
                    okText="Acesso permitido"
                    errorText="Acesso bloqueado"
                    description="O arquivo robots.txt é a porta de entrada. Se a URL estiver bloqueada aqui, os robôs do Google sequer tentarão ler o conteúdo da página."
                  />

                  <StatusRow 
                    label="Status de Redirecionamento"
                    isError={indexing.redirectStatus !== 'ok'}
                    okText="Status 200 (OK)"
                    errorText="Cadeia de 301 ou Erro"
                    description="Múltiplos saltos (Ex: Pag A -> Pag B -> Pag C) esgotam o limite de rastreamento do Google. A página deve carregar diretamente com status 200."
                  />

                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
