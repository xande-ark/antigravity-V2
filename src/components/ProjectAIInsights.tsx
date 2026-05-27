import React from 'react';
import { Sparkles, AlertTriangle, TrendingUp, CheckCircle, ArrowRight } from 'lucide-react';
import type { AnalysisResult } from '../types';

interface Props {
  results: AnalysisResult[];
}

export const ProjectAIInsights: React.FC<Props> = ({ results }) => {
  const total = results.length;
  if (total === 0) return null;

  const indexed = results.filter(r => r.indexing.isIndexed).length;
  const errors = results.filter(r => r.indexing.redirectStatus === '404' || r.indexing.noindex).length;
  const avgScore = Math.round(results.reduce((acc, r) => acc + (r.score || 0), 0) / total);
  
  const needsAttention = results.filter(r => r.score < 50).length;

  return (
    <div 
      className="animate-fade-in-up"
      style={{ 
        background: 'linear-gradient(145deg, #1a1a2e, #0f0f12)',
        border: '1px solid rgba(138, 43, 226, 0.3)',
        borderRadius: '20px',
        padding: '24px',
        marginBottom: '32px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
      }}
    >
      {/* Decorative Glow */}
      <div style={{ 
        position: 'absolute', top: '-50px', right: '-50px', 
        width: '150px', height: '150px', 
        background: 'var(--accent-primary)', 
        filter: 'blur(80px)', opacity: 0.2 
      }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <div style={{ background: 'var(--accent-glow)', padding: '8px', borderRadius: '10px' }}>
          <Sparkles size={20} style={{ color: 'var(--accent-primary)' }} />
        </div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'white' }}>
          Análise Estratégica da IA
        </h3>
        <span style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '20px', color: 'var(--text-muted)', fontWeight: 700, marginLeft: 'auto' }}>
          BETA INSIGHTS
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
        {/* Insight 1: Indexação */}
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: indexed < total * 0.5 ? 'var(--error)' : 'var(--success)' }}>
            {indexed < total * 0.5 ? <AlertTriangle size={16} /> : <CheckCircle size={16} />}
            <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Indexação</span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {indexed === total 
              ? "Excelente! 100% das URLs estão no índice do Google. Sua visibilidade está protegida." 
              : `${total - indexed} URLs ainda não foram encontradas pelo Google. Isso representa um desperdício de ${Math.round(((total-indexed)/total)*100)}% do seu potencial de tráfego.`}
          </p>
        </div>

        {/* Insight 2: Performance */}
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: avgScore < 70 ? 'var(--warning)' : 'var(--success)' }}>
            <TrendingUp size={16} />
            <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Performance Global</span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            A média de velocidade é <strong>{avgScore}</strong>. {needsAttention > 0 
              ? `Atenção: ${needsAttention} páginas estão com nota crítica e podem estar perdendo conversões.` 
              : "Suas páginas estão carregando rápido, o que favorece o ranqueamento Mobile."}
          </p>
        </div>

        {/* Insight 3: Plano de Ação */}
        <div style={{ background: 'rgba(138, 43, 226, 0.05)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(138, 43, 226, 0.2)' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--accent-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ArrowRight size={16} /> O QUE FAZER AGORA?
          </div>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {errors > 0 && <li>• Corrigir os <strong>{errors} erros</strong> de Sitemap para limpar a autoridade do domínio.</li>}
            {avgScore < 90 && <li>• Otimizar as imagens e cache para elevar a nota média acima de 90.</li>}
            {indexed < total && <li>• Enviar o Sitemap atualizado via Google Search Console.</li>}
            {errors === 0 && avgScore >= 90 && indexed === total && <li>• Tudo ok! Focar em criação de novos conteúdos e backlinks.</li>}
          </ul>
        </div>
      </div>
    </div>
  );
};
