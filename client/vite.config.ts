import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Forward /api/* calls to the Express server so the client and API
    // share one origin in dev (no CORS needed).
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
})
