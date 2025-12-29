import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@pg-studio/shared': path.resolve(__dirname, '../../packages/shared/dist'),
      '@pg-studio/layout-engine': path.resolve(__dirname, '../../packages/layout-engine/dist'),
      '@pg-studio/export-manager': path.resolve(__dirname, '../../packages/export-manager/dist'),
    },
  },
})
