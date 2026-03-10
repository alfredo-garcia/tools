import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

const appRoot = path.resolve(process.cwd())
const resolveFromApp = (pkg) => path.join(appRoot, 'node_modules', pkg)

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    dedupe: ['react', 'react-dom', 'react-router-dom'],
    alias: {
      react: resolveFromApp('react'),
      'react-dom': resolveFromApp('react-dom'),
      'react-router-dom': resolveFromApp('react-router-dom')
    }
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'apple-touch-icon.png', 'mask-icon.svg', 'splash.png'],
      manifest: {
        name: 'Mosco Planner',
        short_name: 'Mosco Planner',
        description: 'OKRs, tareas y hábitos',
        theme_color: '#f97316',
        background_color: '#f97316',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        shortcuts: [
          { name: 'Discovery', short_name: 'Discovery', url: '/discovery', description: 'Discovery ideas' },
          { name: 'OKRs', short_name: 'OKRs', url: '/objectives', description: 'Objectives and Key Results' },
          { name: 'Tasks', short_name: 'Tasks', url: '/tasks', description: 'Tasks list' },
          { name: 'Shopping', short_name: 'Shopping', url: '/shopping', description: 'Shopping list' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\./i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10,
              cacheableResponse: { statuses: [0, 200] }
            }
          }
        ]
      }
    })
  ],
  server: {
    proxy: {
      '/api': {
        target: `http://localhost:${process.env.API_PORT || 3000}`,
        changeOrigin: true
      }
    }
  }
})
