import React from 'react';
import type { AnalysisResult } from '../types';
import { Activity, AlertTriangle, Globe, Zap, Search } from 'lucide-react';

interface Props {
  results: AnalysisResult[];
}

export const ProjectDashboard: React.FC<Props> = ({ results }) => {
  const completedResults = results.filter(r => r.status === 'completed');
  
  if (completedResults.length === 0) {
    return (
      <div style={{ padding: '40px 0', color: 'var(--text-muted)' }}>
        <Activity size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
        <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Dashboard Vazio</h3>
        <p>Use a aba "Adicionar URLs" para analisar algumas URLs e gerar estatísticas.</p>
      </div>
    );
  }

  const avgScore = Math.round(completedResults.reduce((acc, r) => acc + r.score, 0) / completedResults.length);
  
  const noindexCount = completedResults.filter(r => r.indexing.noindex).length;
  const canonicalErrorCount = completedResults.filter(r => r.indexing.canonicalStatus !== 'valid').length;
  const poorLcpCount = completedResults.filter(r => r.pageSpeed.lcp.score === 'poor').length;
  const poorClsCount = completedResults.filter(r => r.pageSpeed.cls.score === 'poor').length;
  
  const allBottlenecks = completedResults.flatMap(r => r.criticalBottlenecks);
  const bottlenecksCount = allBottlenecks.length;

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 700, margin: '0 0 8px 0' }}>Visão Geral do Projeto</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Resumo do estado técnico das URLs analisadas até o momento.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '32px', marginBottom: '40px' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity size={24} color="var(--text-primary)" />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>Score Médio</span>
            <div style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1.2 }}>{avgScore}</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Globe size={24} color="var(--text-primary)" />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>URLs Analisadas</span>
            <div style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1.2 }}>{completedResults.length}</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertTriangle size={24} color="var(--warning)" />
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>Total de Gargalos</span>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--warning)', lineHeight: 1.2 }}>{bottlenecksCount}</div>
          </div>
        </div>

      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2px', background: 'var(--border-color)', border: '1px solid var(--border-color)' }}>
        
        <div style={{ background: 'var(--bg-card)', padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
            <Search size={18} /> Alertas de Indexação
          </h3>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <li style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>URLs com Noindex detectado:</span>
              <strong style={{ color: noindexCount > 0 ? 'var(--error)' : 'var(--text-primary)', fontSize: '1.1rem' }}>{noindexCount}</strong>
            </li>
            <li style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Erros de Canonical:</span>
              <strong style={{ color: canonicalErrorCount > 0 ? 'var(--text-primary)' : 'var(--text-primary)', fontSize: '1.1rem' }}>{canonicalErrorCount}</strong>
            </li>
          </ul>
        </div>

        <div style={{ background: 'var(--bg-card)', padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
            <Zap size={18} /> Alertas de Performance
          </h3>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <li style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>LCP Crítico (Muito Lento):</span>
              <strong style={{ color: poorLcpCount > 0 ? 'var(--error)' : 'var(--text-primary)', fontSize: '1.1rem' }}>{poorLcpCount}</strong>
            </li>
            <li style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>CLS Ruim (Página Tremendo):</span>
              <strong style={{ color: 'var(--text-primary)', fontSize: '1.1rem' }}>{poorClsCount}</strong>
            </li>
          </ul>
        </div>

      </div>

    </div>
  );
};
