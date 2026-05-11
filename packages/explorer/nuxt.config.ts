import process from 'node:process'
import { defineNuxtConfig } from 'nuxt/config'

const apiProxyTarget = process.env.ODX_EXPLORER_API_PROXY_TARGET?.replace(/\/$/, '')

export default defineNuxtConfig({
  modules: [
    '@nuxt/ui',
  ],
  css: ['~/app.css'],
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

  vite: {
    server: {
      fs: {
        // Allow serving files from the entire monorepo
        allow: ['../..'],
      },
    },
  },
})
