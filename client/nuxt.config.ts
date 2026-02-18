import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  modules: [
    '@nuxt/devtools-ui-kit',
    '@unocss/nuxt'
  ],
  ssr: false,
  devServer: {
    port: 3300
  },
  app: {
    baseURL: '/__sap_odata__/client'
  },
  css: [
    '@unocss/reset/tailwind.css'
  ],
  devtools: { enabled: false },
  nitro: {
    devProxy: {
      '/__sap_odata__/config': { target: 'http://localhost:3000/__sap_odata__/config', changeOrigin: true },
      '/__sap_odata__/logs': { target: 'http://localhost:3000/__sap_odata__/logs', changeOrigin: true },
      '/__sap_odata__/generate': { target: 'http://localhost:3000/__sap_odata__/generate', changeOrigin: true },
      // Proxy für die echten OData-Anfragen vom Client zum Playground-Server
      '/api/sap-odata': { target: 'http://localhost:3000/api/sap-odata', changeOrigin: true }
    }
  }
})
