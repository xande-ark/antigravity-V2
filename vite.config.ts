import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/cf-api': {
        target: 'https://api.cloudflare.com/client/v4',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/cf-api/, ''),
        secure: true,
      },
      // Proxy do PageSpeed para evitar problemas de CORS/referrer no dev local
      // Em produção (Vercel), a rota /api/pagespeed é tratada pela serverless function
      '/pagespeed-proxy': {
        target: 'https://www.googleapis.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/pagespeed-proxy/, '/pagespeedonline/v5/runPagespeed'),
      },
    },
  },
})
