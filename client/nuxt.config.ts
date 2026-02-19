import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  modules: [
    '@nuxt/devtools-ui-kit',
  ],
  unocss: {
    shortcuts: {
      'bg-base': 'bg-white dark:bg-[#050505]',
      'border-base': 'border-zinc-200 dark:border-zinc-800',
    },
    theme: {
      colors: {
        primary: '#00dc82',
      },
    },
  },
  ssr: false,

  devtools: { enabled: false },

  app: {
    baseURL: '/__sap_odata_explorer',
  },

  // nitro: {
  //   devProxy: {
  //     '/__sap_odata__/config': { target: 'http://127.0.0.1:3000/__sap_odata__/config', changeOrigin: true },
  //     '/__sap_odata__/logs': { target: 'http://127.0.0.1:3000/__sap_odata__/logs', changeOrigin: true },
  //     '/__sap_odata__/generate': { target: 'http://127.0.0.1:3000/__sap_odata__/generate', changeOrigin: true },
  //     '/api/sap-odata': { target: 'http://127.0.0.1:3000/api/sap-odata', changeOrigin: true },
  //   },
  // },

  vite: {
    server: {
      hmr: {
        // Instead of go through proxy, we directly connect real port of the client app
        clientPort: +(process.env.PORT || 3300),
      },
    },
  },
})
