import { defineNuxtConfig } from 'nuxt/config'
import { presetWind, presetIcons } from 'unocss'

export default defineNuxtConfig({
  modules: [
    '@nuxt/devtools-ui-kit',
    '@unocss/nuxt'
  ],
  unocss: {
    presets: [
      presetWind(),
      presetIcons({
        prefix: 'i-',
        scale: 1.2,
      }),
    ],
  },
  ssr: false,
  app: {
    baseURL: '/__sap_odata__/client/'
  },
  compatibilityDate: '2026-02-17'
})
