import React, { useState } from 'react';
import { Play, Link2 } from 'lucide-react';

interface Props {
  onAnalyze: (urls: string[], includeSubpages: boolean) => void;
  isAnalyzing: boolean;
}

export const AnalyzerInput: React.FC<Props> = ({ onAnalyze, isAnalyzing }) => {
  const [urlsText, setUrlsText] = useState('');
  const [includeSubpages, setIncludeSubpages] = useState(false);

  const handleAnalyze = () => {
    const urls = urlsText
      .split('\n')
      .map((u) => u.trim())
      .filter((u) => u.length > 0);
      
    if (urls.length === 0) return;
    
    onAnalyze(urls, includeSubpages);
  };

  return (
    <div className="card" style={{ marginBottom: '32px' }}>
      <h2 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Link2 className="text-accent" />
        Entrada em Massa de URLs
      </h2>
      
      <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '0.9rem' }}>
        Insira uma URL por linha. Nossa engine irá diagnosticar gargalos de PageSpeed e Indexação.
      </p>

      <textarea
        value={urlsText}
        onChange={(e) => setUrlsText(e.target.value)}
        placeholder="https://exemplo.com.br/&#10;https://exemplo.com.br/produto/123"
        style={{
          width: '100%',
          minHeight: '150px',
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          padding: '16px',
          color: 'var(--text-primary)',
          resize: 'vertical',
          marginBottom: '20px',
          fontSize: '0.95rem'
        }}
        disabled={isAnalyzing}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        
        {/* Toggle Customizado */}
        <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
          <div style={{
            width: '44px',
            height: '24px',
            background: includeSubpages ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
            borderRadius: '12px',
            position: 'relative',
            transition: 'background 0.3s ease'
          }}>
            <div style={{
              position: 'absolute',
              top: '2px',
              left: includeSubpages ? '22px' : '2px',
              width: '20px',
              height: '20px',
              background: 'white',
              borderRadius: '50%',
              transition: 'left 0.3s ease',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }} />
          </div>
          <input 
            type="checkbox" 
            checked={includeSubpages}
            onChange={(e) => setIncludeSubpages(e.target.checked)}
            style={{ display: 'none' }}
            disabled={isAnalyzing}
          />
          <span style={{ fontSize: '0.95rem', fontWeight: 500 }}>
            Descobrir e analisar subpáginas via Sitemap automaticamente
          </span>
        </label>

        <button 
          className="btn-primary" 
          onClick={handleAnalyze}
          disabled={isAnalyzing || urlsText.trim().length === 0}
        >
          {isAnalyzing ? (
            <>
              <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              Processando...
            </>
          ) : (
            <>
              <Play size={18} fill="currentColor" />
              Analisar URLs
            </>
          )}
        </button>

      </div>
      
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
