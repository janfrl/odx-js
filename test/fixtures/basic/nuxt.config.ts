import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  modules: ['../../../src/module'],
  odata: {
    services: [
      {
        name: 'TestService',
        url: 'edmx/test-v2.edmx',
        auth: {
          bearerToken: 'test-token-123',
        },
        headers: {
          'x-custom-test': 'it-works',
        },
      },
    ],
  },
  compatibilityDate: '2025-07-15',
})
