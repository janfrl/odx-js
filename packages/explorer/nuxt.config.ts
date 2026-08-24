import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { defineNuxtConfig } from 'nuxt/config'

const apiProxyTarget = process.env.ODX_EXPLORER_API_PROXY_TARGET?.replace(/\/$/, '')
const explorerStyles = fileURLToPath(new URL('./app.css', import.meta.url))

export default defineNuxtConfig({
  modules: [
    '@nuxt/ui',
  ],
  css: [explorerStyles],
  ssr: false,

  // Nuxt 4 & Monorepo Stability
  future: {
    compatibilityVersion: 4,
  },

  experimental: {
    appManifest: false,
  },

  devtools: { enabled: false },

  runtimeConfig: {
    public: {
      odxApiBase: process.env.NUXT_PUBLIC_ODX_API_BASE || process.env.ODX_API_BASE || '',
    },
  },

  routeRules: apiProxyTarget
    ? {
        '/__odx__/**': {
          proxy: `${apiProxyTarget}/__odx__/**`,
        },
      }
    : {},

  app: {
    baseURL: '/__odx__/client/',
    buildAssetsDir: '_nuxt',
  },

  devServer: {
    port: 3300,
  },

})
