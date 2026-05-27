import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/ghl-v1': {
        target: 'https://rest.gohighlevel.com/v1',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/ghl-v1/, ''),
      },
      '/ghl-v2': {
        target: 'https://services.leadconnectorhq.com',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/ghl-v2/, ''),
      },
    }
  }
})
