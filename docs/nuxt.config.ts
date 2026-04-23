export default defineNuxtConfig({
  extends: ['docus'],
  css: ['~/assets/css/main.css'],
  modules: ['@bc8-odx/nuxt', '@nuxtjs/i18n'],
  i18n: {
    defaultLocale: 'en',
    locales: [
      { code: 'en', name: 'English', iso: 'en-US' },
      { code: 'de', name: 'Deutsch', iso: 'de-DE' },
    ],
    strategy: 'prefix',
  },
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
