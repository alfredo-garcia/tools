import path from 'path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const appRoot = path.resolve(process.cwd())
const resolveFromApp = (pkg) => path.join(appRoot, 'node_modules', pkg)

export default defineConfig({
  resolve: {
    dedupe: ['react', 'react-dom', 'react-router-dom'],
    alias: {
      react: resolveFromApp('react'),
      'react-dom': resolveFromApp('react-dom'),
      'react-router-dom': resolveFromApp('react-router-dom'),
    },
  },
  plugins: [react(), tailwindcss()],
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
