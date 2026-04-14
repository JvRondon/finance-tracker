import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/finance-tracker/', 
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Finance Vault',
        short_name: 'Finance',
        description: 'Controle Financeiro Premium',
        theme_color: '#111318',
        background_color: '#111318',
        display: 'standalone',
        icons: [
          {
            src: 'https://cdn-icons-png.flaticon.com/512/3135/3135706.png', 
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  build: {
    chunkSizeWarningLimit: 1600, // Aumenta o limite do aviso para 1.6 MB
  }
})