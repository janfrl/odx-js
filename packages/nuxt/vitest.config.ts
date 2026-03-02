import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'nuxt',
    environment: 'node',
    include: ['**/*.test.ts'],
    alias: {
      '#imports': 'packages/nuxt/src/runtime/composables/useOData.ts', // Dummy pointer, mock will override
    },
  },
})
