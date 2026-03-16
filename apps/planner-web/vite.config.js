import path from 'path'
import { defineConfig } from 'vite'
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
  server: {
    proxy: {
      '/graphql': {
        target: process.env.VITE_PLANNER_API_URL || 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
})
