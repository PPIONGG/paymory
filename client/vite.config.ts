import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    base: env.VITE_BASE_PATH || '/',
    plugins: [react()],
    server: {
      // Forward /api/* calls to the Express server so the client and API
      // share one origin in dev (no CORS needed).
      proxy: {
        '/api': 'http://localhost:4000',
      },
    },
  }
})
