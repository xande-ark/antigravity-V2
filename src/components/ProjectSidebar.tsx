import React, { useState } from 'react';
import type { Project } from '../types';
import { Folder, Plus, Trash2, LayoutDashboard, Search, Zap, PlayCircle, Cloud } from 'lucide-react';

interface Props {
  projects: Project[];
  activeView: 'global_dashboard' | 'global_indexacao' | 'global_pagespeed' | 'quick_check' | string;
  onChangeView: (view: string) => void;
  onCreateProject: (name: string) => void;
  onDeleteProject: (id: string) => void;
  onRenameProject: (id: string, name: string) => void;
  urlCounts: Record<string, number>;
}

export const ProjectSidebar: React.FC<Props> = ({ projects, activeView, onChangeView, onCreateProject, onDeleteProject, onRenameProject, urlCounts }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleCreateSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (newProjectName.trim()) {
      onCreateProject(newProjectName.trim());
      setNewProjectName('');
      setIsCreating(false);
    }
  };

  const handleRenameSubmit = (id: string) => {
    if (editingName.trim()) {
      onRenameProject(id, editingName.trim());
    }
    setEditingProjectId(null);
  };

  return (
    <div style={{
      width: '260px',
      background: 'var(--bg-sidebar)',
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      flexShrink: 0
    }}>
      <div style={{ padding: '24px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ background: 'var(--accent-glow)', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Search className="text-accent" size={18} />
        </div>
        <h1 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }} className="text-gradient">
          SEOMonitor
        </h1>
      </div>

      <div style={{ padding: '10px 20px', flex: 1, overflowY: 'auto' }}>
        
        {/* SEÇÃO: MENU GLOBAL */}
        <div style={{ marginBottom: '32px' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', display: 'block' }}>
            Menu
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <button
              onClick={() => onChangeView('global_dashboard')}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '8px',
                background: activeView === 'global_dashboard' ? 'var(--accent-glow)' : 'transparent',
                color: activeView === 'global_dashboard' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                fontWeight: activeView === 'global_dashboard' ? 600 : 400,
                transition: 'all 0.2s', textAlign: 'left'
              }}
            >
              <LayoutDashboard size={18} /> Dashboard
            </button>
            <button
              onClick={() => onChangeView('global_indexacao')}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '8px',
                background: activeView === 'global_indexacao' ? 'var(--accent-glow)' : 'transparent',
                color: activeView === 'global_indexacao' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                fontWeight: activeView === 'global_indexacao' ? 600 : 400,
                transition: 'all 0.2s', textAlign: 'left'
              }}
            >
              <Search size={18} /> Indexação
            </button>
            <button
              onClick={() => onChangeView('global_pagespeed')}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '8px',
                background: activeView === 'global_pagespeed' ? 'var(--accent-glow)' : 'transparent',
                color: activeView === 'global_pagespeed' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                fontWeight: activeView === 'global_pagespeed' ? 600 : 400,
                transition: 'all 0.2s', textAlign: 'left'
              }}
            >
              <Zap size={18} /> Core Web Vitals
            </button>
            <button
              onClick={() => onChangeView('quick_check')}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '8px',
                background: activeView === 'quick_check' ? 'var(--accent-glow)' : 'transparent',
                color: activeView === 'quick_check' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                fontWeight: activeView === 'quick_check' ? 600 : 400,
                transition: 'all 0.2s', textAlign: 'left'
              }}
            >
              <PlayCircle size={18} /> Quick Check
            </button>
            <button
              onClick={() => onChangeView('cloudflare')}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '8px',
                background: activeView === 'cloudflare' ? 'rgba(249,115,22,0.1)' : 'transparent',
                color: activeView === 'cloudflare' ? '#f97316' : 'var(--text-secondary)',
                fontWeight: activeView === 'cloudflare' ? 600 : 400,
                transition: 'all 0.2s', textAlign: 'left'
              }}
            >
              <Cloud size={18} /> Cloudflare
            </button>
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', padding: '0 4px' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
              Projetos
            </span>
            <button 
              onClick={() => setIsCreating(true)}
              style={{ 
                background: 'var(--accent-glow)', border: '1px solid var(--accent-primary)', 
                color: 'var(--accent-primary)', cursor: 'pointer', 
                padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem',
                fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px'
              }}
              className="btn-hover-effect"
            >
              <Plus size={14} /> NOVO
            </button>
          </div>

          {isCreating && (
            <form onSubmit={handleCreateSubmit} style={{ marginBottom: '16px', padding: '0 4px' }}>
              <input
                autoFocus
                placeholder="Nome do projeto..."
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                onBlur={() => !newProjectName && setIsCreating(false)}
                style={{
                  width: '100%',
                  background: 'var(--bg-app)',
                  border: '1px solid var(--accent-primary)',
                  borderRadius: '6px',
                  padding: '8px 10px',
                  color: 'white',
                  fontSize: '0.85rem',
                  outline: 'none',
                  boxShadow: '0 0 10px var(--accent-glow)'
                }}
              />
            </form>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {projects.length === 0 ? (
              <div style={{ padding: '20px 16px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px dashed var(--border-color)', marginTop: '8px' }}>
                <Folder size={24} style={{ color: 'var(--text-muted)', margin: '0 auto 8px', opacity: 0.5 }} />
                <div style={{ color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>Nenhum projeto</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', lineHeight: 1.4 }}>Crie um projeto para começar a monitorar.</div>
              </div>
            ) : (
              projects.map(project => (
                <div 
                  key={project.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: activeView === project.id ? 'var(--bg-card)' : 'transparent',
                    borderRadius: '8px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                    {editingProjectId === project.id ? (
                      <input
                        autoFocus
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onBlur={() => handleRenameSubmit(project.id)}
                        onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit(project.id)}
                        style={{
                          flex: 1,
                          margin: '6px 12px',
                          background: 'var(--bg-app)',
                          border: '1px solid var(--accent-primary)',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          color: 'white',
                          fontSize: '0.9rem',
                          outline: 'none'
                        }}
                      />
                    ) : (
                      <button
                        onClick={() => onChangeView(project.id)}
                        onDoubleClick={() => {
                          setEditingProjectId(project.id);
                          setEditingName(project.name);
                        }}
                        style={{
                          flex: 1, display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px',
                          color: activeView === project.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                          textAlign: 'left', overflow: 'hidden'
                        }}
                      >
                        <Folder size={16} color={activeView === project.id ? 'var(--text-primary)' : 'currentColor'} />
                        <span style={{ fontWeight: activeView === project.id ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.9rem' }}>
                          {project.name}
                        </span>
                        <span style={{ marginLeft: 'auto', background: 'var(--bg-card-hover)', color: 'var(--text-muted)', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '12px', fontWeight: 600 }}>
                          {urlCounts[project.id] || 0}
                        </span>
                      </button>
                    )}
                  </div>

                  {activeView === project.id && editingProjectId !== project.id && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeleteProject(project.id); }}
                      style={{ padding: '10px', color: 'var(--text-muted)' }}
                      onMouseOver={(e) => e.currentTarget.style.color = 'var(--error)'}
                      onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                      title="Excluir Projeto"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
