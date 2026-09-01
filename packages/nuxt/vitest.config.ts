import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: [
      {
        find: '#imports',
        replacement: fileURLToPath(new URL('./test/imports.mock.ts', import.meta.url)),
      },
      {
        find: /^@me-tools\/odx-proxy$/u,
        replacement: fileURLToPath(new URL('../proxy/src/index.ts', import.meta.url)),
      },
    ],
  },
  test: {
    name: 'nuxt',
    environment: 'node',
    include: ['test/**/*.test.ts'],
    // Disable parallelism because these tests start heavy Nuxt servers
    fileParallelism: false,
    hookTimeout: 60000,
    teardownTimeout: 30000,
  },
})
