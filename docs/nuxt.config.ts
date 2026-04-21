export default defineNuxtConfig({
  extends: ['docus'],
  modules: ['@bc8-odx/nuxt'],
  compatibilityDate: '2026-04-21',
  site: {
    name: 'ODX',
    description: 'Modern OData Developer Experience for Nuxt and SAP BTP'
  },
  odata: {
    // Disable devtools in docs site to avoid potential conflicts with Docus
    devtools: {
      enabled: false
    }
  }
})
