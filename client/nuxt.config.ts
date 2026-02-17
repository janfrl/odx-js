import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  modules: [
    '@nuxt/devtools-ui-kit'
  ],
  ssr: false,
  app: {
    baseURL: '/__sap_odata__/client'
  },
  nitro: {
    output: {
      publicDir: '../dist/client'
    }
  }
})
