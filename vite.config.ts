import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Forward all /api calls to the Platinum Window backend
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      // Also proxy /health for status checks
      '/health': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
