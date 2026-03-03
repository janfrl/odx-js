import process from 'node:process'
import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  modules: [
    '@nuxt/ui',
  ],
  css: ['~/app.css'],
  ssr: false,

  devtools: { enabled: false },

  app: {
    baseURL: '/__odx__/client',
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
