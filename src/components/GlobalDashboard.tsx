import type { Project, AnalysisResult } from '../types';
import { ProjectTable } from './ProjectTable';
import { Folder, Globe, Zap, ArrowRight, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';

interface Props {
  projects: Project[];
  resultsByProject: Record<string, AnalysisResult[]>;
  onDeleteProject: (id: string) => void;
  onViewDetails: (id: string) => void;
  onSelectResult: (result: AnalysisResult) => void;
  onNavigate: (view: string) => void;
}

export const GlobalDashboard: React.FC<Props> = ({ projects, resultsByProject, onDeleteProject, onViewDetails, onSelectResult, onNavigate }) => {
  const allResults = Object.values(resultsByProject).flat();
  const completedResults = allResults.filter(r => r.status === 'completed');
  
  const totalUrls = allResults.length;
  const indexadas = completedResults.filter(r => r.indexing.isIndexed).length;
  const naoIndexadas = completedResults.filter(r => r.indexing.noindex).length;
  const aguardando = completedResults.length - indexadas - naoIndexadas;
  
  const avgPageSpeed = completedResults.length > 0 
    ? Math.round(completedResults.reduce((acc, r) => acc + r.score, 0) / completedResults.length) 
    : 0;

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '40px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700, margin: '0 0 8px 0' }}>Dashboard</h1>
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
          {projects.length} projetos - {totalUrls} URLs monitoradas
        </p>
      </div>

      {/* Cards Superiores Globais */}
      {/* Cards Superiores Globais Interativos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        {/* Card: Projetos */}
        <div 
          onClick={() => {
            const el = document.getElementById('project-list-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          className="dashboard-card-premium"
          style={{ 
            background: 'linear-gradient(135deg, rgba(138, 43, 226, 0.1), rgba(0, 0, 0, 0))',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '24px',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ background: 'rgba(138, 43, 226, 0.1)', padding: '10px', borderRadius: '12px' }}>
              <Folder size={24} style={{ color: 'var(--accent-primary)' }} />
            </div>
            <ArrowRight size={18} className="card-arrow" style={{ color: 'var(--text-muted)', transition: 'transform 0.3s' }} />
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Total de Projetos</span>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, marginTop: '8px', letterSpacing: '-1px' }}>{projects.length}</div>
          <div style={{ marginTop: '12px', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            Gerenciar ativos <TrendingUp size={14} style={{ color: 'var(--success)' }} />
          </div>
        </div>

        {/* Card: URLs */}
        <div 
          onClick={() => onNavigate('global_indexacao')}
          className="dashboard-card-premium"
          style={{ 
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(0, 0, 0, 0))',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '24px',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '10px', borderRadius: '12px' }}>
              <Globe size={24} style={{ color: 'var(--info)' }} />
            </div>
            <ArrowRight size={18} className="card-arrow" style={{ color: 'var(--text-muted)', transition: 'transform 0.3s' }} />
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>URLs Monitoradas</span>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, marginTop: '8px', letterSpacing: '-1px' }}>{totalUrls}</div>
          <div style={{ marginTop: '12px', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            Ver status de indexação <Globe size={14} style={{ color: 'var(--info)' }} />
          </div>
        </div>

        {/* Card: PageSpeed */}
        <div 
          onClick={() => onNavigate('global_pagespeed')}
          className="dashboard-card-premium"
          style={{ 
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(0, 0, 0, 0))',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '24px',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '10px', borderRadius: '12px' }}>
              <Zap size={24} style={{ color: 'var(--warning)' }} />
            </div>
            <ArrowRight size={18} className="card-arrow" style={{ color: 'var(--text-muted)', transition: 'transform 0.3s' }} />
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>PageSpeed Médio</span>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, marginTop: '8px', letterSpacing: '-1px', color: 'var(--warning)' }}>{avgPageSpeed}</div>
          <div style={{ marginTop: '12px', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            Monitor de Core Web Vitals <Zap size={14} style={{ color: 'var(--warning)' }} />
          </div>
        </div>

        {/* Card: Indexadas */}
        <div 
          onClick={() => onNavigate('global_indexacao')}
          className="dashboard-card-premium"
          style={{ 
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(0, 0, 0, 0))',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '24px',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ background: 'rgba(34, 197, 94, 0.1)', padding: '10px', borderRadius: '12px' }}>
              <CheckCircle size={24} style={{ color: 'var(--success)' }} />
            </div>
            <ArrowRight size={18} className="card-arrow" style={{ color: 'var(--text-muted)', transition: 'transform 0.3s' }} />
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>URLs Indexadas</span>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, marginTop: '8px', letterSpacing: '-1px', color: 'var(--success)' }}>{indexadas}</div>
          <div style={{ marginTop: '12px', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            Confirmadas no Google <CheckCircle size={14} style={{ color: 'var(--success)' }} />
          </div>
        </div>

        {/* Card: Não Indexadas */}
        <div 
          onClick={() => onNavigate('global_indexacao')}
          className="dashboard-card-premium"
          style={{ 
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(0, 0, 0, 0))',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '24px',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '12px' }}>
              <AlertCircle size={24} style={{ color: 'var(--error)' }} />
            </div>
            <ArrowRight size={18} className="card-arrow" style={{ color: 'var(--text-muted)', transition: 'transform 0.3s' }} />
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Com Erro / Off</span>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, marginTop: '8px', letterSpacing: '-1px', color: 'var(--error)' }}>{naoIndexadas}</div>
          <div style={{ marginTop: '12px', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            Requerem sua atenção <AlertCircle size={14} style={{ color: 'var(--error)' }} />
          </div>
        </div>
      </div>

      {/* Indexing Progress Bar */}
      {completedResults.length > 0 && (
        <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Status de Indexação Global</span>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
              {Math.round((indexadas / completedResults.length) * 100)}% Indexado
            </span>
          </div>
          <div style={{ display: 'flex', height: '12px', borderRadius: '6px', overflow: 'hidden', gap: '2px' }}>
            <div style={{ width: `${(indexadas / completedResults.length) * 100}%`, background: 'var(--success)', transition: 'width 0.5s ease-out' }} title={`${indexadas} Indexadas`} />
            <div style={{ width: `${(aguardando / completedResults.length) * 100}%`, background: 'var(--warning)', transition: 'width 0.5s ease-out' }} title={`${aguardando} Aguardando Google`} />
            <div style={{ width: `${(naoIndexadas / completedResults.length) * 100}%`, background: 'var(--error)', transition: 'width 0.5s ease-out' }} title={`${naoIndexadas} Não Indexadas`} />
          </div>
          <div style={{ display: 'flex', gap: '24px', marginTop: '16px', fontSize: '0.8rem', fontWeight: 600 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success)' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }} />
              {indexadas} Indexadas
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--warning)' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--warning)' }} />
              {aguardando} Aguardando
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--error)' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--error)' }} />
              {naoIndexadas} Não Indexadas
            </div>
          </div>
        </div>
      )}

      {/* Lista de Projetos (Tabelas) */}
      <div id="project-list-section">
        {projects.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)', background: 'var(--bg-card)', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Nenhum projeto criado</h3>
            <p>Clique no '+' na barra lateral para criar seu primeiro projeto e começar a monitorar URLs.</p>
          </div>
        ) : (
          projects.map(project => (
            <div key={project.id} style={{ marginBottom: '48px', animation: 'fade-in-up 0.5s ease-out' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px', padding: '0 8px' }}>
                <div>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>Projeto</span>
                  <h3 
                    onClick={() => onViewDetails(project.id)}
                    style={{ cursor: 'pointer', margin: '4px 0 0', fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}
                    onMouseOver={(e) => e.currentTarget.style.color = 'var(--accent-primary)'}
                    onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                  >
                    {project.name}
                  </h3>
                </div>
                <button 
                  onClick={() => onViewDetails(project.id)} 
                  style={{ 
                    padding: '8px 16px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', 
                    borderRadius: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600, 
                    cursor: 'pointer', transition: 'all 0.2s' 
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.background = 'var(--bg-card-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = 'var(--bg-tertiary)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                >
                  Abrir Projeto
                </button>
              </div>
              <ProjectTable 
                project={project} 
                results={resultsByProject[project.id] || []}
                onDeleteProject={onDeleteProject}
                onViewDetails={onViewDetails}
                onSelectResult={onSelectResult}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
};
