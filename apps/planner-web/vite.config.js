import path from 'path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

const appRoot = path.resolve(process.cwd())
const resolveFromApp = (pkg) => path.join(appRoot, 'node_modules', pkg)

export default defineConfig({
  resolve: {
    dedupe: ['react', 'react-dom', 'react-router-dom'],
    alias: {
      react: resolveFromApp('react'),
      'react-dom': resolveFromApp('react-dom'),
      'react-router-dom': resolveFromApp('react-router-dom'),
      'lucide-react': resolveFromApp('lucide-react'),
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'apple-touch-icon.png', 'mask-icon.svg', 'splash.png'],
      manifest: {
        name: 'Planner',
        short_name: 'Planner',
        description: 'OKRs, tasks, habits, meals and shopping list',
        theme_color: '#f97316',
        background_color: '#f97316',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
        shortcuts: [
          { name: 'Planner', short_name: 'Planner', url: '/', description: 'Weekly planner' },
          { name: 'Tasks', short_name: 'Tasks', url: '/tasks', description: 'Tasks list' },
          { name: 'Meals', short_name: 'Meals', url: '/meals', description: 'Meals planner' },
          { name: 'Shopping', short_name: 'Shopping', url: '/shopping', description: 'Shopping list' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/, /^\/graphql/],
      },
    }),
  ],
  server: (() => {
    const env = loadEnv(process.env.NODE_ENV || 'development', process.cwd(), '')
    const target =
      env.VITE_PLANNER_API_URL ||
      process.env.VITE_PLANNER_API_URL ||
      `http://localhost:${env.API_PORT || process.env.API_PORT || 4000}`
    return {
      proxy: {
        '/api': { target, changeOrigin: true },
        '/graphql': { target, changeOrigin: true },
      },
    }
  })(),
})
