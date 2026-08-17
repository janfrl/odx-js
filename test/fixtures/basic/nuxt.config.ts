import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  modules: ['../../../src/module'],
  odata: {
    telemetry: {
      enabled: true,
    },
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
      {
        name: 'Northwind',
        route: 'northwind',
        url: 'edmx/northwind-v2.edmx',
        strategy: 'proxied',
      },
    ],
  },
  compatibilityDate: '2025-07-15',
})
