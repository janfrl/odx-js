import process from 'node:process'
import { defineNuxtConfig } from 'nuxt/config'

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

  app: {
    baseURL: '/__odx__/client/',
    buildAssetsDir: '_nuxt',
  },

  devServer: {
    port: 3300,
  },

  vite: {
    server: {
      hmr: {
        clientPort: +(process.env.PORT || 3300),
      },
      fs: {
        // Allow serving files from the entire monorepo
        allow: ['../..'],
      },
    },
  },
})
