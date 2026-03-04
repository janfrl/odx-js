import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'proxy',
    environment: 'node',
    include: ['**/*.test.ts'],
    // Disable parallelism to avoid port conflicts with integration tests
    fileParallelism: false,
    hookTimeout: 60000,
    teardownTimeout: 30000,
  },
})
