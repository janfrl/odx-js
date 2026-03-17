import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  // Nuxt 4 compatibility
  compatibilityDate: '2026-03-17',

  future: {
    compatibilityVersion: 4,
  },

  modules: [
    '@bc8-odx/nuxt',
    '@nuxt/ui',
  ],

  devtools: { enabled: true },

  css: ['~/app.css'],

  odata: {
    services: [
      {
        name: 'V2Service',
        url: 'edmx/v2.edmx',
        route: 'v2',
        icon: 'i-lucide-box',
      },
      {
        name: 'V4Service',
        url: 'edmx/v4.edmx',
        route: 'v4',
        icon: 'i-lucide-package',
      },
      {
        name: 'Northwind',
        url: 'https://services.odata.org/V2/Northwind/Northwind.svc',
        route: 'northwind',
        icon: 'i-lucide-globe',
      },
      {
        name: 'NorthwindDirect',
        url: 'https://services.odata.org/V2/Northwind/Northwind.svc',
        strategy: 'direct',
        icon: 'i-lucide-zap',
      },
    ],
  },
})
