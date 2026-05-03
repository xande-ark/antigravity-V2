const CF_API = '/cf-api';

export interface CloudflareZone {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'initializing' | 'pending';
  plan: { name: string };
  modified_on: string;
}

export interface ZoneSetting {
  id: string;
  value: string | boolean | object;
  editable: boolean;
}

export interface SettingStatus {
  id: string;
  label: string;
  category: 'ssl' | 'speed' | 'security' | 'network';
  current: string;
  recommended: string;
  isCompliant: boolean;
}

// GET requests must NOT include Content-Type to avoid CORS preflight failure
const getHeaders = (token: string) => {
  if (token.length < 40 && !token.includes('.')) {
    // Likely a Global API Key or needs email - but we'll assume Token first
    // If user provides "email:key", we split it
    if (token.includes(':')) {
      const [email, key] = token.split(':');
      return { 'X-Auth-Email': email, 'X-Auth-Key': key };
    }
  }
  return { 'Authorization': `Bearer ${token}` };
};

// PATCH/POST requests need Content-Type
const mutateHeaders = (token: string) => {
  const h = getHeaders(token) as any;
  return { ...h, 'Content-Type': 'application/json' };
};

/** Verify token by listing zones — simplest CORS-friendly check */
export const verifyToken = async (token: string): Promise<{ valid: boolean }> => {
  const res = await fetch(`${CF_API}/zones?per_page=1`, { headers: getHeaders(token) });
  const data = await res.json();
  return { valid: data.success === true };
};

/** List all zones (domains) for the account */
export const listZones = async (token: string, accountId?: string): Promise<CloudflareZone[]> => {
  const params = accountId ? `?account.id=${accountId}&per_page=50` : '?per_page=50';
  const res = await fetch(`${CF_API}/zones${params}`, { headers: getHeaders(token) });
  const data = await res.json();
  if (!data.success) throw new Error(data.errors?.[0]?.message ?? 'Falha ao listar domínios');
  return data.result as CloudflareZone[];
};

/** Get all settings for a zone */
export const getZoneSettings = async (token: string, zoneId: string): Promise<ZoneSetting[]> => {
  const res = await fetch(`${CF_API}/zones/${zoneId}/settings`, { headers: getHeaders(token) });
  const data = await res.json();
  if (!data.success) throw new Error(data.errors?.[0]?.message ?? 'Falha ao ler configurações');
  return data.result as ZoneSetting[];
};

/** Map raw settings to a human-readable compliance table */
export const analyzeSettings = (settings: ZoneSetting[]): SettingStatus[] => {
  const get = (id: string): string => {
    const s = settings.find(x => x.id === id);
    if (!s) return 'N/A';
    if (typeof s.value === 'object' && s.value !== null) return JSON.stringify(s.value);
    return String(s.value);
  };

  const minify = settings.find(x => x.id === 'minify')?.value as any;
  const minifyStr = minify ? `js:${minify.js} css:${minify.css} html:${minify.html}` : 'N/A';
  const minifyOk = minify ? (minify.js === 'off' && minify.css === 'off' && minify.html === 'off') : false;

  return [
    { id: 'ssl', label: 'SSL/TLS Mode', category: 'ssl', current: get('ssl'), recommended: 'full', isCompliant: get('ssl') === 'full' },
    { id: 'always_use_https', label: 'Always HTTPS', category: 'ssl', current: get('always_use_https'), recommended: 'on', isCompliant: get('always_use_https') === 'on' },
    { id: 'min_tls_version', label: 'TLS Mínimo', category: 'ssl', current: get('min_tls_version'), recommended: '1.2', isCompliant: get('min_tls_version') >= '1.2' },
    { id: 'tls_1_3', label: 'TLS 1.3', category: 'ssl', current: get('tls_1_3'), recommended: 'on', isCompliant: get('tls_1_3') === 'on' },
    { id: 'automatic_https_rewrites', label: 'HTTPS Rewrites', category: 'ssl', current: get('automatic_https_rewrites'), recommended: 'on', isCompliant: get('automatic_https_rewrites') === 'on' },
    { 
      id: 'security_header', 
      label: 'HSTS', 
      category: 'ssl', 
      current: (settings.find(x => x.id === 'security_header')?.value as any)?.strict_transport_security?.enabled ? 'Ativado' : 'Desativado', 
      recommended: 'Ativado (6m)', 
      isCompliant: (settings.find(x => x.id === 'security_header')?.value as any)?.strict_transport_security?.enabled === true 
    },
    { id: 'rocket_loader', label: 'Rocket Loader', category: 'speed', current: get('rocket_loader'), recommended: 'off', isCompliant: get('rocket_loader') === 'off' },
    { id: 'early_hints', label: 'Early Hints', category: 'speed', current: get('early_hints'), recommended: 'on', isCompliant: get('early_hints') === 'on' },
    { id: 'minify', label: 'Auto Minify', category: 'speed', current: minifyStr, recommended: 'tudo off', isCompliant: minifyOk },
    { id: 'browser_cache_ttl', label: 'Browser Cache TTL', category: 'speed', current: get('browser_cache_ttl'), recommended: '14400+', isCompliant: Number(get('browser_cache_ttl')) >= 14400 },
    { id: 'brotli', label: 'Brotli', category: 'speed', current: get('brotli'), recommended: 'on', isCompliant: get('brotli') === 'on' },
    { id: 'bot_fight_mode', label: 'Bot Fight Mode', category: 'security', current: get('bot_fight_mode'), recommended: 'on', isCompliant: get('bot_fight_mode') === 'on' },
    { id: 'security_level', label: 'Security Level', category: 'security', current: get('security_level'), recommended: 'medium+', isCompliant: ['medium', 'high', 'under_attack'].includes(get('security_level')) },
    { id: 'browser_check', label: 'Browser Integrity Check', category: 'security', current: get('browser_check'), recommended: 'on', isCompliant: get('browser_check') === 'on' },
    { id: 'challenge_ttl', label: 'Challenge TTL', category: 'security', current: get('challenge_ttl'), recommended: '≥1800s', isCompliant: Number(get('challenge_ttl')) >= 1800 },
    { id: 'http2', label: 'HTTP/2', category: 'network', current: get('http2'), recommended: 'on', isCompliant: get('http2') === 'on' },
    { id: 'http3', label: 'HTTP/3 (QUIC)', category: 'network', current: get('http3'), recommended: 'on', isCompliant: get('http3') === 'on' },
    { id: 'ipv6', label: 'IPv6', category: 'network', current: get('ipv6'), recommended: 'on', isCompliant: get('ipv6') === 'on' },
    { id: 'opportunistic_encryption', label: 'Opportunistic Encryption', category: 'network', current: get('opportunistic_encryption'), recommended: 'on', isCompliant: get('opportunistic_encryption') === 'on' },
  ];
};

/** Apply a single setting to a zone */
const applySetting = async (token: string, zoneId: string, settingId: string, value: unknown): Promise<boolean> => {
  const res = await fetch(`${CF_API}/zones/${zoneId}/settings/${settingId}`, {
    method: 'PATCH',
    headers: mutateHeaders(token),
    body: JSON.stringify({ value }),
  });
  const data = await res.json();
  return data.success === true;
};

/** Apply all recommended settings to a zone */
export const applyRecommendedSettings = async (
  token: string,
  zoneId: string,
  onProgress: (done: number, total: number, label: string) => void
): Promise<{ success: number; failed: string[] }> => {
  const settingsToApply: { id: string; value: unknown; label: string }[] = [
    { id: 'ssl', value: 'full', label: 'SSL Mode → Full' },
    { id: 'always_use_https', value: 'on', label: 'Always HTTPS → On' },
    { id: 'tls_1_3', value: 'on', label: 'TLS 1.3 → On' },
    { id: 'automatic_https_rewrites', value: 'on', label: 'HTTPS Rewrites → On' },
    { id: 'min_tls_version', value: '1.2', label: 'TLS Mínimo → 1.2' },
    { 
      id: 'security_header', 
      value: { 
        strict_transport_security: { 
          enabled: true, 
          max_age: 15552000, 
          include_subdomains: true, 
          preload: true, 
          nosniff: false 
        } 
      }, 
      label: 'HSTS → Ativado (6 meses)' 
    },
    { id: 'rocket_loader', value: 'off', label: 'Rocket Loader → Off' },
    { id: 'early_hints', value: 'on', label: 'Early Hints → On' },
    { id: 'minify', value: { js: 'off', css: 'off', html: 'off' }, label: 'Auto Minify → Off' },
    { id: 'brotli', value: 'on', label: 'Brotli → On' },
    { id: 'http2', value: 'on', label: 'HTTP/2 → On' },
    { id: 'http3', value: 'on', label: 'HTTP/3 → On' },
    { id: 'ipv6', value: 'on', label: 'IPv6 → On' },
    { id: 'opportunistic_encryption', value: 'on', label: 'Opp. Encryption → On' },
  ];

  let success = 0;
  const failed: string[] = [];

  for (let i = 0; i < settingsToApply.length; i++) {
    const { id, value, label } = settingsToApply[i];
    onProgress(i, settingsToApply.length, label);
    try {
      const ok = await applySetting(token, zoneId, id, value);
      if (ok) success++; else failed.push(label);
    } catch {
      failed.push(label);
    }
  }

  onProgress(settingsToApply.length, settingsToApply.length, 'Concluído!');
  return { success, failed };
};

/** WAF & Rate Limiting Interfaces */
export interface FirewallRule {
  id: string;
  description: string;
  action: string;
  paused: boolean;
}

/** Get Custom WAF Rules (Modern Ruleset API) */
export const getCustomRules = async (token: string, zoneId: string): Promise<FirewallRule[]> => {
  const res = await fetch(`${CF_API}/zones/${zoneId}/rulesets`, { headers: getHeaders(token) });
  const data = await res.json();
  const customRuleset = data.result?.find((r: any) => r.phase === 'http_request_firewall_custom');
  
  if (!customRuleset) return [];
  
  const rulesRes = await fetch(`${CF_API}/zones/${zoneId}/rulesets/${customRuleset.id}`, { headers: getHeaders(token) });
  const rulesData = await rulesRes.json();
  return (rulesData.result?.rules || []).map((r: any) => ({
    id: r.id,
    description: r.description,
    action: r.action,
    paused: !r.enabled
  }));
};

/** Get Rate Limit Rules (Modern Ruleset API) */
export const getRateLimits = async (token: string, zoneId: string): Promise<FirewallRule[]> => {
  const res = await fetch(`${CF_API}/zones/${token.includes('_') ? zoneId : zoneId}/rulesets`, { headers: getHeaders(token) });
  const data = await res.json();
  const ratelimitRuleset = data.result?.find((r: any) => r.phase === 'http_ratelimit');
  
  if (!ratelimitRuleset) return [];
  
  const rulesRes = await fetch(`${CF_API}/zones/${zoneId}/rulesets/${ratelimitRuleset.id}`, { headers: getHeaders(token) });
  const rulesData = await rulesRes.json();
  return (rulesData.result?.rules || []).map((r: any) => ({
    id: r.id,
    description: r.description,
    action: r.action,
    paused: !r.enabled
  }));
};

/** Create International Block Rule (Modern Ruleset API) */
export const createInternationalBlockRule = async (token: string, zoneId: string): Promise<boolean> => {
  // 1. Get the custom ruleset ID
  const rsRes = await fetch(`${CF_API}/zones/${zoneId}/rulesets`, { headers: getHeaders(token) });
  const rsData = await rsRes.json();
  let customRuleset = rsData.result?.find((r: any) => r.phase === 'http_request_firewall_custom');

  if (!customRuleset) return false;

  // 2. Add rule to the ruleset
  const res = await fetch(`${CF_API}/zones/${zoneId}/rulesets/${customRuleset.id}/rules`, {
    method: 'POST',
    headers: mutateHeaders(token),
    body: JSON.stringify({
      description: 'Bloquear Tráfego Internacional (Exceto Bots)',
      expression: '(ip.src.country ne "BR" and not cf.client.bot)',
      action: 'block',
      enabled: true
    })
  });
  const data = await res.json();
  return data.success;
};

/** Create API Rate Limit Rule (Modern Rulesets API) */
export const createApiRateLimitRule = async (token: string, zoneId: string): Promise<boolean> => {
  try {
    // 1. Get zone rulesets directly
    const rsRes = await fetch(`${CF_API}/zones/${zoneId}/rulesets`, { headers: getHeaders(token) });
    const rsData = await rsRes.json();
    
    if (!rsData.success) {
      throw new Error(rsData.errors?.[0]?.message || 'Falha ao listar rulesets');
    }

    let ratelimitRuleset = rsData.result?.find((r: any) => r.phase === 'http_ratelimit');

    // 2. If ruleset doesn't exist, we MUST use the Legacy API for this account
    if (!ratelimitRuleset) {
      console.log('Ruleset phase not found, forcing Legacy API');
      return await createLegacyRateLimit(token, zoneId);
    }

    // 3. Add the rule with the EXACT expression requested
    const res = await fetch(`${CF_API}/zones/${zoneId}/rulesets/${ratelimitRuleset.id}/rules`, {
      method: 'POST',
      headers: mutateHeaders(token),
      body: JSON.stringify({
        description: 'Antigravity: API Rate Limiting',
        expression: '(http.request.uri.path wildcard "/api/*")',
        action: 'block',
        ratelimit: {
          characteristics: ['ip.src', 'cf.colo.id'],
          period: 10,
          requests_per_period: 10,
          mitigation_timeout: 10
        },
        enabled: true
      })
    });
    const data = await res.json();
    if (data.success) return true;

    // Se falhar, vamos ver o erro real
    const errorMsg = data.errors?.[0]?.message || 'Erro desconhecido';
    const errorCode = data.errors?.[0]?.code || '';
    const errorDetails = JSON.stringify(data.errors?.[0]?.error_chain || '');
    
    console.error('Erro detalhado Ruleset:', data);
    
    if (errorCode === 10000) {
      alert("ERRO 10000: Cloudflare recusou por permissão de Conta. Tente usar o formato email:chave_global no campo do Token.");
    } else {
      alert(`Erro Cloudflare (Ruleset): ${errorMsg} [Código: ${errorCode}] ${errorDetails}`);
    }

    // 4. Final fallback
    return await createLegacyRateLimit(token, zoneId);
  } catch (e: any) {
    console.error(e);
    return await createLegacyRateLimit(token, zoneId);
  }
};

/** Separate Legacy Function for clarity */
async function createLegacyRateLimit(token: string, zoneId: string) {
  try {
    const legacyRes = await fetch(`${CF_API}/zones/${zoneId}/rate_limits`, {
      method: 'POST',
      headers: mutateHeaders(token),
      body: JSON.stringify({
        threshold: 10,
        period: 10,
        action: { mode: 'block', timeout: 60 },
        match: {
          request: {
            url: `*/api/*`,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
          }
        },
        description: 'Antigravity: API Rate Limiting',
        enabled: true
      })
    });
    const data = await legacyRes.json();
    return data.success;
  } catch (e) {
    return false;
  }
}

/** Diagnostic: Check what the token can actually see */
export const diagnosticCheck = async (token: string, zoneId: string) => {
  const results: string[] = [];
  
  // Test 1: User/Token Verify
  try {
    const res = await fetch(`${CF_API}/user/tokens/verify`, { headers: getHeaders(token) });
    const data = await res.json();
    results.push(`Token Verify: ${data.success ? '✅ OK' : '❌ Falhou (' + (data.errors?.[0]?.message || 'Erro') + ')'}`);
  } catch (e) { results.push(`Token Verify: ❌ Erro de Rede`); }

  // Test 2: Zone Read
  try {
    const res = await fetch(`${CF_API}/zones/${zoneId}`, { headers: getHeaders(token) });
    const data = await res.json();
    results.push(`Zone Read: ${data.success ? '✅ OK' : '❌ Falhou'}`);
  } catch (e) { results.push(`Zone Read: ❌ Erro de Rede`); }

  // Test 3: Account Rulesets
  try {
    const res = await fetch(`${CF_API}/zones/${zoneId}/rulesets`, { headers: getHeaders(token) });
    const data = await res.json();
    results.push(`Rulesets Access: ${data.success ? '✅ OK' : '❌ Falhou'}`);
  } catch (e) { results.push(`Rulesets Access: ❌ Erro de Rede`); }

  alert(`DIAGNÓSTICO:\n${results.join('\n')}`);
};
