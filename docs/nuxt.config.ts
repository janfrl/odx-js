export default defineNuxtConfig({
  extends: ['docus'],
  css: ['~/assets/css/main.css'],
  modules: ['@bc8-odx/nuxt'],
  compatibilityDate: 'latest',
  site: {
    name: 'ODX',
    description: 'Modern OData Developer Experience for Nuxt and SAP BTP',
  },
  odata: {
    devtools: {
      enabled: false,
    },
  },
})
