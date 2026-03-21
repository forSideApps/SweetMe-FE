import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 21001,
    proxy: {
      '/api': 'http://localhost:21002'
    }
  },
  optimizeDeps: {
    include: ['react-fast-marquee']
  }
})
