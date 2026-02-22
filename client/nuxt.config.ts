import process from 'node:process'
import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  modules: [
    '@nuxt/devtools-ui-kit',
  ],
  ssr: false,

  devtools: { enabled: false },

  app: {
    baseURL: '/__sap_odata__/client',
  },
  vite: {
    server: {
      hmr: {
        // Instead of go through proxy, we directly connect real port of the client app
        clientPort: +(process.env.PORT || 3300),
      },
    },
  },
  unocss: {
    shortcuts: {
      // Background levels
      'bg-base': 'bg-zinc-100 dark:bg-[#050505]',
      'bg-surface': 'bg-zinc-50 dark:bg-[#0a0a0a]',
      'bg-content': 'bg-white dark:bg-[#0c0c0d]',

      // Border and Text
      'border-base': 'border-zinc-200 dark:border-zinc-800',
      'text-base': 'text-zinc-900 dark:text-zinc-300',
      'text-muted': 'text-zinc-500 dark:text-zinc-500',
    },
    theme: {
      colors: {
        primary: '#00dc82',
      },
    },
  },
})
