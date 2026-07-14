import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'metadata',
    environment: 'node',
    include: ['**/*.test.ts'],
  },
})
