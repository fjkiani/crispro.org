import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiUrl = env.VITE_API_URL || 'http://localhost:8000'
  const paeUrl = env.VITE_PAE_URL || 'http://localhost:5001'

  return {
    plugins: [react(), tailwindcss()],
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
