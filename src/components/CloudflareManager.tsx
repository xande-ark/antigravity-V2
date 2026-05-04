import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, ChevronDown, ChevronRight, Zap, Lock, Shield, Globe, RefreshCw } from 'lucide-react';
import {
  verifyToken, listZones, getZoneSettings, analyzeSettings, applyRecommendedSettings,
  getCustomRules, getRateLimits, createInternationalBlockRule, createApiRateLimitRule, diagnosticCheck,
  type CloudflareZone, type SettingStatus, type FirewallRule
} from '../lib/cloudflare';

const STORAGE_KEY_TOKEN = 'cf_api_token';
const STORAGE_KEY_ACCOUNT = 'cf_account_id';

const categoryMeta: Record<string, { label: string; icon: React.FC<any>; color: string }> = {
  ssl: { label: 'SSL/TLS', icon: Lock, color: 'var(--success)' },
  speed: { label: 'Velocidade', icon: Zap, color: 'var(--warning)' },
  security: { label: 'Segurança', icon: Shield, color: '#f97316' },
  network: { label: 'Rede', icon: Globe, color: 'var(--info)' },
};

const StatusIcon: React.FC<{ ok: boolean }> = ({ ok }) =>
  ok
    ? <CheckCircle size={14} style={{ color: 'var(--success)', flexShrink: 0 }} />
    : <XCircle size={14} style={{ color: 'var(--error)', flexShrink: 0 }} />;

const PlanBadge: React.FC<{ name: string }> = ({ name }) => {
  const color = name.toLowerCase().includes('pro') ? '#f97316'
    : name.toLowerCase().includes('business') ? '#8b5cf6'
    : 'var(--text-muted)';
  return (
    <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', border: `1px solid ${color}`, color, textTransform: 'uppercase' }}>
      {name.replace('Cloudflare ', '')}
    </span>
  );
};

interface ZoneCardProps {
  zone: CloudflareZone;
  token: string;
  isSelected: boolean;
  onToggle: () => void;
  expanded: boolean;
  onExpand: () => void;
}

const ZoneCard: React.FC<ZoneCardProps> = ({ zone, token, isSelected, onToggle, expanded, onExpand }) => {
  const [settings, setSettings] = useState<SettingStatus[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [wafRules, setWafRules] = useState<FirewallRule[]>([]);
  const [rateLimits, setRateLimits] = useState<FirewallRule[]>([]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const raw = await getZoneSettings(token, zone.id);
      setSettings(analyzeSettings(raw));
      const rules = await getCustomRules(token, zone.id);
      setWafRules(rules);
      const limits = await getRateLimits(token, zone.id);
      setRateLimits(limits);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (expanded && !settings && !loading) loadSettings();
  }, [expanded]);

  const handleApply = async () => {
    setApplying(true);
    await applyRecommendedSettings(token, zone.id, () => {});
    setApplying(false);
    await loadSettings();
  };

  const categories = ['ssl', 'speed', 'security', 'network'] as const;
  const compliantCount = settings?.filter(s => s.isCompliant).length ?? 0;
  const totalCount = settings?.length ?? 0;
  const healthPct = totalCount > 0 ? Math.round((compliantCount / totalCount) * 100) : 0;

  return (
    <div style={{ borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', overflow: 'hidden', transition: 'all 0.2s ease' }}>
      <div 
        style={{ padding: '16px', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
        onClick={onExpand}
      >
        <input 
          type="checkbox" 
          checked={isSelected} 
          onClick={(e) => e.stopPropagation()}
          onChange={onToggle}
          style={{ marginRight: '16px', cursor: 'pointer' }}
        />
        <div style={{ flex: 2, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: zone.status === 'active' ? 'var(--success)' : 'var(--text-muted)' }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{zone.name}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{zone.id.slice(0, 8)}...</div>
          </div>
        </div>
        <div style={{ flex: 1 }}><PlanBadge name={zone.plan.name} /></div>
        <div style={{ flex: 1 }}>
          {settings && (
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: healthPct >= 80 ? 'var(--success)' : healthPct >= 50 ? 'var(--warning)' : 'var(--error)' }}>
              {healthPct}% OK
            </span>
          )}
        </div>
        <div style={{ width: '40px', display: 'flex', justifyContent: 'flex-end', color: 'var(--text-muted)' }}>
          {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </div>
      </div>

      {expanded && (
        <div style={{ borderTop: '1px solid var(--border-color)', padding: '20px' }}>
          {loading && <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}><RefreshCw size={16} className="spin" /> Carregando...</div>}
          
          {settings && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                {categories.map(cat => {
                  const meta = categoryMeta[cat];
                  const catSettings = settings.filter(s => s.category === cat);
                  const Icon = meta.icon;
                  return (
                    <div key={cat} style={{ background: 'var(--bg-app)', borderRadius: '10px', padding: '16px', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <Icon size={15} style={{ color: meta.color }} />
                        <span style={{ fontWeight: 700, fontSize: '0.8rem', color: meta.color, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{meta.label}</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {catSettings.map(s => (
                          <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem' }}>
                            <StatusIcon ok={s.isCompliant} />
                            <span style={{ color: 'var(--text-secondary)', flex: 1 }}>{s.label}</span>
                            <span style={{ color: s.isCompliant ? 'var(--success)' : 'var(--error)', fontWeight: 600, fontSize: '0.75rem' }}>{s.current}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                {!applying && (
                  <>
                    <button
                      onClick={handleApply}
                      style={{ background: 'linear-gradient(135deg, #f97316 0%, #f59e0b 100%)', color: '#000', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                      <Zap size={15} /> Aplicar Recomendadas
                    </button>
                    <button
                      onClick={loadSettings}
                      style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}
                    >
                      <RefreshCw size={13} /> Atualizar
                    </button>
                  </>
                )}
              </div>

              {/* Firewall Rules Section */}
              <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <Shield size={16} style={{ color: '#f97316' }} />
                  <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Segurança (WAF)</span>
                  <button onClick={() => diagnosticCheck(token, zone.id)} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: 'var(--accent-primary)', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}>
                    Diagnosticar
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                   <div style={{ background: 'var(--bg-app)', padding: '12px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                      <span>Bloqueio Internacional</span>
                      {wafRules.some(r => r.description.includes('Internacional')) ? <span style={{ color: 'var(--success)' }}>ATIVO</span> : <button onClick={async () => { await createInternationalBlockRule(token, zone.id); loadSettings(); }} style={{ fontSize: '0.7rem' }}>Criar</button>}
                   </div>
                   <div style={{ background: 'var(--bg-app)', padding: '12px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                      <span>Rate Limit API</span>
                      {rateLimits.some(r => r.description.includes('Antigravity')) ? <span style={{ color: 'var(--success)' }}>ATIVO</span> : <button onClick={async () => { await createApiRateLimitRule(token, zone.id); loadSettings(); }} style={{ fontSize: '0.7rem' }}>Criar</button>}
                   </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export const CloudflareManager: React.FC = () => {
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_KEY_TOKEN) ?? '');
  const [accountId, setAccountId] = useState(() => localStorage.getItem(STORAGE_KEY_ACCOUNT) ?? '');
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connError, setConnError] = useState('');
  const [zones, setZones] = useState<CloudflareZone[]>([]);
  const [selectedZoneIds, setSelectedZoneIds] = useState<string[]>([]);
  const [expandedZone, setExpandedZone] = useState<string | null>(null);
  const [bulkApplying, setBulkApplying] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ done: 0, total: 0, currentLabel: '' });
  const [showToken, setShowToken] = useState(false);

  useEffect(() => { if (token) handleConnect(true); }, []);

  const handleConnect = async (silent = false) => {
    if (!token.trim()) return;
    setConnecting(true);
    setConnError('');
    try {
      const verify = await verifyToken(token.trim());
      if (!verify.valid) throw new Error('Token inválido.');
      const zoneList = await listZones(token.trim(), accountId.trim() || undefined);
      setZones(zoneList);
      setConnected(true);
      localStorage.setItem(STORAGE_KEY_TOKEN, token.trim());
      localStorage.setItem(STORAGE_KEY_ACCOUNT, accountId.trim());
    } catch (e: any) {
      if (!silent) setConnError(e.message);
      setConnected(false);
    } finally { setConnecting(false); }
  };

  const handleDisconnect = () => {
    setConnected(false);
    setZones([]);
    setSelectedZoneIds([]);
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    localStorage.removeItem(STORAGE_KEY_ACCOUNT);
  };

  const toggleZoneSelection = (id: string) => {
    setSelectedZoneIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const selectAll = () => {
    if (selectedZoneIds.length === zones.length) setSelectedZoneIds([]);
    else setSelectedZoneIds(zones.map(z => z.id));
  };

  const handleBulkAction = async (action: 'settings' | 'waf_intl' | 'waf_rate' | 'all') => {
    if (selectedZoneIds.length === 0) return;
    setBulkApplying(true);
    setBulkProgress({ done: 0, total: selectedZoneIds.length, currentLabel: 'Iniciando...' });

    for (let i = 0; i < selectedZoneIds.length; i++) {
      const zoneId = selectedZoneIds[i];
      const zoneName = zones.find(z => z.id === zoneId)?.name || zoneId;
      setBulkProgress(prev => ({ ...prev, done: i, currentLabel: `Configurando ${zoneName}...` }));
      try {
        if (action === 'settings' || action === 'all') await applyRecommendedSettings(token, zoneId, () => {});
        if (action === 'waf_intl' || action === 'all') await createInternationalBlockRule(token, zoneId);
        if (action === 'waf_rate' || action === 'all') await createApiRateLimitRule(token, zoneId);
      } catch (e) { console.error(e); }
    }
    setBulkProgress(prev => ({ ...prev, done: selectedZoneIds.length, currentLabel: 'Concluído!' }));
    setTimeout(() => { setBulkApplying(false); setSelectedZoneIds([]); handleConnect(true); }, 2000);
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '60px' }}>
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0 }}>Cloudflare Manager</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Automação de segurança e performance em lote.</p>
        </div>
        {connected && (
          <button onClick={handleDisconnect} style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>
            Desconectar
          </button>
        )}
      </div>

      {!connected ? (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>API TOKEN</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  value={token} 
                  onChange={e => setToken(e.target.value)} 
                  style={{ flex: 1, background: 'var(--bg-app)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '10px', borderRadius: '8px', WebkitTextSecurity: showToken ? 'none' : 'disc' } as React.CSSProperties}
                />
                <button onClick={() => setShowToken(!showToken)} style={{ padding: '0 12px', background: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer' }}>
                  {showToken ? 'Ocultar' : 'Ver'}
                </button>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>ACCOUNT ID (OPCIONAL)</label>
              <input type="text" value={accountId} onChange={e => setAccountId(e.target.value)} style={{ width: '100%', background: 'var(--bg-app)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '10px', borderRadius: '8px' }} />
            </div>
            {connError && <div style={{ color: 'var(--error)', fontSize: '0.85rem' }}>{connError}</div>}
            <button onClick={() => handleConnect()} disabled={connecting} style={{ background: 'linear-gradient(135deg, #f97316, #f59e0b)', color: '#000', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 800, cursor: 'pointer' }}>
              {connecting ? 'Conectando...' : 'Conectar à Cloudflare'}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Bulk Action Bar */}
          {selectedZoneIds.length > 0 && (
            <div style={{ marginBottom: '20px', padding: '16px', background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.3)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '16px', position: 'sticky', top: '20px', zIndex: 10, backdropFilter: 'blur(8px)' }}>
              <div style={{ fontWeight: 700, color: '#f97316' }}>{selectedZoneIds.length} domínios</div>
              <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
                <button onClick={() => handleBulkAction('all')} disabled={bulkApplying} style={{ padding: '8px 16px', background: 'linear-gradient(135deg, #a855f7, #8b5cf6)', border: 'none', borderRadius: '6px', color: 'white', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 12px rgba(139,92,246,0.3)' }}>🚀 CONFIGURAR TUDO</button>
                <button onClick={() => handleBulkAction('settings')} disabled={bulkApplying} style={{ padding: '8px 12px', background: 'var(--accent-primary)', border: 'none', borderRadius: '6px', color: 'white', cursor: 'pointer' }}>SSL/HSTS</button>
                <button onClick={() => handleBulkAction('waf_intl')} disabled={bulkApplying} style={{ padding: '8px 12px', background: '#1e293b', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'white', cursor: 'pointer' }}>WAF</button>
                <button onClick={() => handleBulkAction('waf_rate')} disabled={bulkApplying} style={{ padding: '8px 12px', background: '#1e293b', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'white', cursor: 'pointer' }}>Rate Limit</button>
              </div>
            </div>
          )}

          {bulkApplying && (
            <div style={{ marginBottom: '20px', padding: '16px', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{bulkProgress.currentLabel}</span>
                <span>{bulkProgress.done}/{bulkProgress.total}</span>
              </div>
              <div style={{ height: '4px', background: 'var(--bg-app)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ width: `${(bulkProgress.done / bulkProgress.total) * 100}%`, height: '100%', background: 'var(--accent-primary)', transition: 'width 0.3s ease' }} />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', padding: '0 16px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              <input type="checkbox" checked={selectedZoneIds.length === zones.length && zones.length > 0} onChange={selectAll} style={{ marginRight: '16px' }} />
              <div style={{ flex: 2 }}>Domínio</div>
              <div style={{ flex: 1 }}>Plano</div>
              <div style={{ flex: 1 }}>Status</div>
              <div style={{ width: '40px' }}></div>
            </div>
            {zones.map(zone => (
              <ZoneCard 
                key={zone.id} 
                zone={zone} 
                token={token} 
                isSelected={selectedZoneIds.includes(zone.id)} 
                onToggle={() => toggleZoneSelection(zone.id)}
                expanded={expandedZone === zone.id}
                onExpand={() => setExpandedZone(expandedZone === zone.id ? null : zone.id)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
