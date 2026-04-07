import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    name: 'explorer',
    environment: 'happy-dom',
    include: ['test/**/*.test.ts'],
  },
})
