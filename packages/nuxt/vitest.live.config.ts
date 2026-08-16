import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '#imports': fileURLToPath(new URL('./test/imports.mock.ts', import.meta.url)),
    },
  },
  test: {
    name: 'nuxt-live-northwind',
    environment: 'node',
    include: ['live/**/*.test.ts'],
    fileParallelism: false,
    hookTimeout: 60000,
    teardownTimeout: 30000,
  },
})
