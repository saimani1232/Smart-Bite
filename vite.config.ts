import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy UPCitemdb API to avoid CORS issues
      '/api/upcitemdb': {
        target: 'https://api.upcitemdb.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/upcitemdb/, '')
      },
      // Proxy Open Food Facts API to avoid CORS issues
      '/api/openfoodfacts': {
        target: 'https://world.openfoodfacts.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/openfoodfacts/, '/api/v0')
      }
    }
  }
})
