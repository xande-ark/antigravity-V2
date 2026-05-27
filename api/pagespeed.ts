import type { VercelRequest, VercelResponse } from '@vercel/node';

const PAGESPEED_API_KEY = process.env.VITE_PAGESPEED_API_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Allow CORS from the front-end origin
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { url, strategy = 'mobile' } = req.query;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL is required' });
  }

  if (!PAGESPEED_API_KEY) {
    return res.status(500).json({ error: 'PAGESPEED_API_KEY não configurada no servidor.' });
  }

  try {
    const targetUrl = url.startsWith('http') ? url : `https://${url}`;
    const psUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(targetUrl)}&key=${PAGESPEED_API_KEY}&category=PERFORMANCE&category=ACCESSIBILITY&category=BEST_PRACTICES&category=SEO&strategy=${strategy}&_t=${Date.now()}`;

    console.log(`[PageSpeed API] Fetching ${strategy} for: ${targetUrl}`);

    const response = await fetch(psUrl);
    const data = await response.json();

    if (!response.ok) {
      const apiError = data?.error;
      console.error('[PageSpeed API] Error:', apiError);
      return res.status(response.status).json({
        error: apiError?.message || `PageSpeed API retornou status ${response.status}`,
        code: apiError?.code,
      });
    }

    // Return the full Lighthouse result to the client
    return res.status(200).json(data);
  } catch (error: any) {
    console.error('[PageSpeed API] Fetch failed:', error.message);
    return res.status(500).json({ error: error.message || 'Erro interno ao consultar PageSpeed' });
  }
}
