import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath, URL } from 'node:url'
import { INDEXABLE_ROUTES } from './src/siteRoutes'

function seoFilesPlugin(): Plugin {
  let mode = 'production'
  return {
    name: 'crispro-seo-files',
    configResolved(config) {
      mode = config.mode
    },
    closeBundle() {
      const env = loadEnv(mode, process.cwd(), '')
      const base = (env.VITE_SITE_URL || 'https://crispro.org').replace(/\/$/, '')
      const lastmod = new Date().toISOString().slice(0, 10)
      const outDir = resolve(process.cwd(), 'dist')

      const urlEntries = INDEXABLE_ROUTES.map(
        (r) => `  <url>
    <loc>${base}${r.path === '/' ? '/' : r.path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`,
      ).join('\n')

      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>
`
      writeFileSync(resolve(outDir, 'sitemap.xml'), sitemap, 'utf8')

      const robots = `User-agent: *
Allow: /

Sitemap: ${base}/sitemap.xml
`
      writeFileSync(resolve(outDir, 'robots.txt'), robots, 'utf8')
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiUrl = env.VITE_API_URL || 'http://localhost:8000'
  const paeUrl = env.VITE_PAE_URL || 'http://localhost:5001'

  return {
    plugins: [react(), tailwindcss(), seoFilesPlugin()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    server: {
      port: 5173,
      proxy: {
        // PAE-Onc specific API routes → Express backend
        // These MUST come before the generic /api catch-all
        '/api/stats': { target: paeUrl, changeOrigin: true },
        '/api/health': { target: paeUrl, changeOrigin: true },
        '/api/denials': { target: paeUrl, changeOrigin: true },
        '/api/appeals': { target: paeUrl, changeOrigin: true },
        '/api/patients': { target: paeUrl, changeOrigin: true },
        '/api/drugs': { target: paeUrl, changeOrigin: true },
        '/api/nccn': { target: paeUrl, changeOrigin: true },
        '/api/payer-policies': { target: paeUrl, changeOrigin: true },
        '/api/ground-truth': { target: paeUrl, changeOrigin: true },
        '/api/fax-log': { target: paeUrl, changeOrigin: true },
        '/api/org': { target: paeUrl, changeOrigin: true },
        '/api/agents': { target: paeUrl, changeOrigin: true },
        '/api/etl': { target: paeUrl, changeOrigin: true },
        // Forward all OTHER /api calls to the Python FastAPI backend
        '/api': {
          target: apiUrl,
          changeOrigin: true,
        },
        '/health': {
          target: apiUrl,
          changeOrigin: true,
        },
      },
    },
  }
})
