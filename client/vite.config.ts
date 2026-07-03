import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const envDir = path.resolve(import.meta.dirname, '..')
  const env = loadEnv(mode, envDir, '')

  return {
    envDir,
    plugins: [react()],
    server: {
      port: Number(env.CLIENT_PORT) || 5173,
      proxy: {
        '/trpc': `http://localhost:${env.SERVER_PORT || 4000}`,
      },
    },
  }
})
