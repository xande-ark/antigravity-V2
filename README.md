# Antigravity V2 - SEO Dashboard

Antigravity is a premium SEO Dashboard designed to monitor performance, indexing status, and technical health of websites. Built with React, TypeScript, and Vite, it provides a sleek, high-performance interface for SEO professionals.

## 🚀 Features

- **Global Dashboard**: Overview of all your projects with real-time health scores.
- **Indexing Status**: Check if your pages are indexed by Google and identify canonical issues.
- **PageSpeed Analysis**: Deep dive into Core Web Vitals (LCP, CLS, TBT) and performance scores.
- **Cloudflare Integration**: Monitor traffic and security directly from your dashboard.
- **AI Insights**: Automated technical diagnostic and action plans for site optimization.
- **Bulk Analysis**: Import multiple domains or sitemaps for mass auditing.

## 🛠️ Technology Stack

- **Frontend**: React 19 + TypeScript
- **Bundler**: Vite
- **Styling**: TailwindCSS (or Custom CSS)
- **Icons**: Lucide React
- **API Integrations**:
  - Google PageSpeed Insights API
  - Google Search Console / Indexing API
  - Gemini AI (for diagnostics)
  - Serper.dev (for search data)

## 📦 Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/xande-ark/antigravity-V2.git
   cd antigravity-V2
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   Create a `.env` file in the root directory based on `.env.example`:
   ```bash
   VITE_PAGESPEED_API_KEY=your_key
   VITE_INDEXING_API_KEY=your_key
   VITE_SEARCH_CONSOLE_API_KEY=your_key
   VITE_SERPER_API_KEY=your_key
   VITE_GEMINI_API_KEY=your_key
   ```

4. **Run in development mode**:
   ```bash
   npm run dev
   ```

5. **Build for production**:
   ```bash
   npm run build
   ```

## 📄 License

MIT License - feel free to use and modify for your own projects.
