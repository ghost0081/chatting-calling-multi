import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://darkgray-yak-842420.hostingersite.com',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    outDir: '../public',
    emptyOutDir: true
  }
})
