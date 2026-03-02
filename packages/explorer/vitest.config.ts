import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'explorer',
    environment: 'happy-dom',
    include: ['test/**/*.test.ts'],
  },
})
