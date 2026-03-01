import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: [
      'packages/*',
      {
        test: {
          name: 'nuxt',
          environment: 'node',
          include: ['packages/nuxt/test/**/*.test.ts'],
        },
      },
    ],
  },
})
