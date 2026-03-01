import { defineWorkspace } from 'vitest/config'

export default defineWorkspace([
  'packages/*',
  {
    test: {
      name: 'nuxt',
      environment: 'node',
      include: ['packages/nuxt/test/**/*.test.ts'],
    },
  },
])
