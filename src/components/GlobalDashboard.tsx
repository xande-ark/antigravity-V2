import React from 'react';
import type { Project, AnalysisResult } from '../types';
import { ProjectTable } from './ProjectTable';

interface Props {
  projects: Project[];
  resultsByProject: Record<string, AnalysisResult[]>;
  onDeleteProject: (id: string) => void;
  onViewDetails: (id: string) => void;
}

export const GlobalDashboard: React.FC<Props> = ({ projects, resultsByProject, onDeleteProject, onViewDetails }) => {
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="card-border-top" style={{ '--top-color': 'var(--accent-primary)', padding: '20px' } as any}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total de Projetos</span>
          <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '8px' }}>{projects.length}</div>
        </div>
        
        <div className="card-border-top" style={{ '--top-color': 'var(--info)', padding: '20px' } as any}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>URLs Monitoradas</span>
          <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '8px' }}>{totalUrls}</div>
        </div>
        
        <div className="card-border-top" style={{ '--top-color': 'var(--warning)', padding: '20px' } as any}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>PageSpeed Médio</span>
          <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '8px', color: 'var(--warning)' }}>{avgPageSpeed}</div>
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
      <div>
        {projects.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)', background: 'var(--bg-card)', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Nenhum projeto criado</h3>
            <p>Clique no '+' na barra lateral para criar seu primeiro projeto e começar a monitorar URLs.</p>
          </div>
        ) : (
          projects.map(project => (
            <ProjectTable 
              key={project.id} 
              project={project} 
              results={resultsByProject[project.id] || []}
              onDeleteProject={onDeleteProject}
              onViewDetails={onViewDetails}
            />
          ))
        )}
      </div>
    </div>
  );
};
