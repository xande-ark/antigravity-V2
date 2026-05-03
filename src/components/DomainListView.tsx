import React, { useState } from 'react';
import type { AnalysisResult } from '../types';
import { CheckCircle2, XCircle, ChevronDown, ChevronUp, Trash2, Search, Users, Activity } from 'lucide-react';

interface Props {
  results: AnalysisResult[];
  viewMode: 'pagespeed' | 'indexacao';
  onDeleteUrl: (id: string) => void;
}

const getScoreColor = (score: number) => {
  if (score >= 90) return 'var(--success)';
  if (score >= 50) return 'var(--warning)';
  return 'var(--error)';
};

const CircleProgress = ({ score, label }: { score: number, label: string }) => {
  const color = getScoreColor(score);
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
      <div style={{ position: 'relative', width: '70px', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="70" height="70" style={{ transform: 'rotate(-90deg)', position: 'absolute', top: 0, left: 0 }}>
          <circle cx="35" cy="35" r={radius} fill="transparent" stroke="var(--border-color)" strokeWidth="4" />
          <circle 
            cx="35" cy="35" r={radius} 
            fill="transparent" 
            stroke={color} 
            strokeWidth="4" 
            strokeDasharray={circumference} 
            strokeDashoffset={strokeDashoffset} 
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s ease-out' }}
          />
        </svg>
        <span style={{ fontSize: '1.2rem', fontWeight: 700, color }}>{score}</span>
      </div>
      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center', maxWidth: '80px' }}>
        {label}
      </span>
    </div>
  );
};

const VitalsCard = ({ label, value, scoreLevel }: { label: string, value: string, scoreLevel: 'good'|'needs-improvement'|'poor' }) => {
  const color = scoreLevel === 'good' ? 'var(--success)' : scoreLevel === 'needs-improvement' ? 'var(--warning)' : 'var(--error)';
  const bgClass = scoreLevel === 'good' ? 'badge-success' : scoreLevel === 'needs-improvement' ? 'badge-warning' : 'badge-error';
  const text = scoreLevel === 'good' ? 'BOM' : scoreLevel === 'needs-improvement' ? 'MELHORAR' : 'RUIM';
  
  return (
    <div style={{ background: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px', minWidth: '160px' }}>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '1.6rem', fontWeight: 800, color, marginBottom: '12px', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
        {parseFloat(value)} <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{value.replace(/[^a-zA-Z]/g, '')}</span>
      </div>
      <span className={`badge ${bgClass}`} style={{ fontSize: '0.7rem', padding: '4px 8px', borderRadius: '16px' }}>{text}</span>
    </div>
  );
}

const StatusRow = ({ label, description, okText, errorText, isError }: { status: string, label: string, description: string, okText: string, errorText: string, isError: boolean }) => {
  const color = isError ? 'var(--error)' : 'var(--success)';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--bg-app)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: 600 }}>{label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color, fontWeight: 600, fontSize: '0.85rem' }}>
          {isError ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
          {isError ? errorText : okText}
        </div>
      </div>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{description}</p>
    </div>
  );
};

const DomainListItem: React.FC<{ result: AnalysisResult, defaultTab: 'pagespeed' | 'indexacao', onDeleteUrl: (id: string) => void }> = ({ result, defaultTab, onDeleteUrl }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'pagespeed' | 'indexacao'>(defaultTab);

  if (result.status === 'analyzing') {
    return (
      <div className="card" style={{ marginBottom: '8px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '20px', height: '20px', border: '2px solid var(--accent-primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <span style={{ color: 'var(--text-secondary)' }}>Analisando {result.url}...</span>
        </div>
      </div>
    );
  }

  const { pageSpeed, indexing } = result;

  return (
    <div className="card" style={{ marginBottom: '12px', padding: 0, overflow: 'hidden', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
      {/* HEADER DA LISTA */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ 
          padding: '16px 20px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          cursor: 'pointer',
          background: isExpanded ? 'var(--bg-tertiary)' : 'transparent',
          transition: 'background 0.2s ease'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
          <div style={{ 
            width: '36px', height: '36px', 
            borderRadius: '50%', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: '0.95rem',
            background: 'var(--bg-app)',
            color: getScoreColor(result.score),
            border: `2px solid ${getScoreColor(result.score)}`
          }}>
            {result.score}
          </div>
          <div style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            <h3 style={{ fontSize: '1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              {result.url}
              {result.isSubpage && <span style={{ fontSize: '0.65rem', background: 'var(--bg-app)', padding: '2px 6px', borderRadius: '12px', color: 'var(--text-secondary)' }}>Subpágina</span>}
            </h3>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={(e) => { e.stopPropagation(); onDeleteUrl(result.id); }}
            style={{ color: 'var(--text-muted)', padding: '4px' }}
            onMouseOver={(e) => e.currentTarget.style.color = 'var(--error)'}
            onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
            title="Excluir URL"
          >
            <Trash2 size={18} />
          </button>
          <div style={{ color: 'var(--text-muted)' }}>
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        </div>
      </div>

      {/* CONTEÚDO EXPANDIDO */}
      {isExpanded && (
        <div style={{ borderTop: '1px solid var(--border-color)', background: 'var(--bg-tertiary)' }}>
          
          {/* TABS INTERNAS (Estilo Imagem 2) */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', padding: '0 24px' }}>
            <button 
              onClick={() => setActiveTab('indexacao')}
              style={{ padding: '16px', fontWeight: 600, fontSize: '0.9rem', borderBottom: activeTab === 'indexacao' ? '2px solid var(--accent-primary)' : '2px solid transparent', color: activeTab === 'indexacao' ? 'var(--accent-primary)' : 'var(--text-secondary)' }}
            >
              Indexação
            </button>
            <button 
              onClick={() => setActiveTab('pagespeed')}
              style={{ padding: '16px', fontWeight: 600, fontSize: '0.9rem', borderBottom: activeTab === 'pagespeed' ? '2px solid var(--accent-primary)' : '2px solid transparent', color: activeTab === 'pagespeed' ? 'var(--accent-primary)' : 'var(--text-secondary)' }}
            >
              PageSpeed
            </button>
          </div>

          <div style={{ padding: '32px 24px' }}>
            
            {activeTab === 'pagespeed' && (
             <div>
                {/* Experiência do Usuário (Core Web Vitals) */}
                <div style={{ marginBottom: '40px' }}>
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 600 }}>
                    <div style={{ background: 'var(--bg-app)', padding: '6px', borderRadius: '6px' }}><Users size={16} className="text-accent" /></div>
                    Entender a experiência dos seus usuários
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                    <VitalsCard label="LCP" value={pageSpeed.lcp.value} scoreLevel={pageSpeed.lcp.score} />
                    <VitalsCard label="CLS" value={pageSpeed.cls.value} scoreLevel={pageSpeed.cls.score} />
                    <VitalsCard label="INP" value={pageSpeed.inp.value} scoreLevel={pageSpeed.inp.score} />
                  </div>
                </div>

                {/* Problemas de Desempenho (Rings) */}
                <div>
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px', color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 600 }}>
                    <div style={{ background: 'var(--bg-app)', padding: '6px', borderRadius: '6px' }}><Activity size={16} color="var(--warning)" /></div>
                    Diagnosticar problemas de desempenho
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '48px', justifyContent: 'flex-start', paddingLeft: '16px' }}>
                    <CircleProgress score={pageSpeed.scores?.performance || result.score} label="Desempenho" />
                    <CircleProgress score={pageSpeed.scores?.accessibility || 92} label="Acessibilidade" />
                    <CircleProgress score={pageSpeed.scores?.bestPractices || 100} label="Práticas Recomendadas" />
                    <CircleProgress score={pageSpeed.scores?.seo || 89} label="SEO" />
                  </div>
                </div>
             </div>
            )}

            {activeTab === 'indexacao' && (
             <div>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 600 }}>
                  <div style={{ background: 'var(--bg-app)', padding: '6px', borderRadius: '6px' }}><Search size={16} className="text-accent" /></div>
                  Diagnóstico de Rastreamento
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                  <StatusRow 
                    label="Tag Canonical"
                    status={indexing.canonicalStatus}
                    isError={indexing.canonicalStatus !== 'valid'}
                    okText="Tag válida"
                    errorText="Conflito ou Ausente"
                    description="A tag Canonical diz ao Google qual é a URL principal (original). Se estiver errada, o Google pode considerar a página como conteúdo duplicado."
                  />
                  <StatusRow 
                    label="Diretiva Noindex"
                    status={indexing.noindex ? 'error' : 'ok'}
                    isError={indexing.noindex}
                    okText="Ausente (Indexável)"
                    errorText="Detectado (Bloqueia indexação)"
                    description="A tag 'noindex' instrui explicitamente o Google a remover a página de seus resultados. Se esta página deve receber tráfego, isso é um erro crítico."
                  />
                  <StatusRow 
                    label="Robots.txt"
                    status={indexing.robotsBlocked ? 'error' : 'ok'}
                    isError={indexing.robotsBlocked}
                    okText="Acesso permitido"
                    errorText="Acesso bloqueado"
                    description="O arquivo robots.txt é a porta de entrada. Se a URL estiver bloqueada aqui, os robôs do Google sequer tentarão ler o conteúdo."
                  />
                  <StatusRow 
                    label="Status de Redirecionamento"
                    status={indexing.redirectStatus}
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

export const DomainListView: React.FC<Props> = ({ results, viewMode, onDeleteUrl }) => {
  if (results.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
        <Search size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
        <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Nenhuma URL analisada</h3>
        <p>Use a aba "Quick Check" para adicionar novas URLs neste projeto.</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {results.map(result => (
          <DomainListItem key={result.id} result={result} defaultTab={viewMode} onDeleteUrl={onDeleteUrl} />
        ))}
      </div>
    </div>
  );
};
