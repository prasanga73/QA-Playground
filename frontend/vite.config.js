import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Anchored regex, not a plain '/api' prefix: a bare prefix would also
      // swallow app routes that merely start with those letters, e.g. /apis.
      '^/api/': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '^/images/': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '^/api-docs': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '^/openapi\\.json$': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
