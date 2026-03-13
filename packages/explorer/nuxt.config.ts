import process from 'node:process'
import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  modules: [
    '@nuxt/ui',
  ],
  css: ['~/app.css'],
  ssr: false,

  devtools: { enabled: false },

  typescript: {
    tsconfig: {
      extends: './tsconfig.nuxt.json',
    },
  },

  app: {
    baseURL: '/explorer/',
  },
  vite: {
    server: {
      hmr: {
        clientPort: +(process.env.PORT || 3300),
      },
      fs: {
        allow: [
          '../../',
        ],
      },
    },
    optimizeDeps: {
      include: [
        'dagre',
      ],
    },
  },
} as any)
