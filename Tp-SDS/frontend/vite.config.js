// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true
  },
  // Forzar compatibilidad con Node.js 20.14
  build: {
    target: 'es2020'
  },
  esbuild: {
    target: 'es2020'
  }
})