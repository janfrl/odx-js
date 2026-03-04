import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'nuxt',
    environment: 'node',
    include: ['**/*.test.ts'],
    // Disable parallelism because these tests start heavy Nuxt servers
    fileParallelism: false,
    hookTimeout: 60000,
    teardownTimeout: 30000,
    alias: {
      '#imports': 'packages/nuxt/src/runtime/composables/useOData.ts', // Dummy pointer, mock will override
    },
  },
})
