// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/claim-checker/',
  build: {
    outDir: 'dist', 
    emptyOutDir: true      
  }
})
