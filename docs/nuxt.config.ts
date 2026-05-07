import { existsSync, mkdirSync, rmSync, statSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const siteUrl = process.env.NUXT_PUBLIC_SITE_URL || process.env.NUXT_SITE_URL
const docsDir = dirname(fileURLToPath(import.meta.url))
const payloadCacheDir = resolve(docsDir, '.nuxt/cache/nuxt/payload')

if (existsSync(payloadCacheDir) && !statSync(payloadCacheDir).isDirectory()) {
  rmSync(payloadCacheDir)
}

mkdirSync(payloadCacheDir, { recursive: true })

export default defineNuxtConfig({
  extends: ['docus'],
  css: ['~/assets/css/main.css'],
  modules: ['@bc8-odx/nuxt', '@nuxtjs/i18n'],
  i18n: {
    defaultLocale: 'en',
    locales: [
      { code: 'en', name: 'English', iso: 'en-US' },
      { code: 'de', name: 'Deutsch', iso: 'de-DE' },
    ],
    strategy: 'prefix',
  },
  vite: {
    optimizeDeps: {
      include: [
        '@shikijs/twoslash',
        '@shikijs/vitepress-twoslash/client',
        '@vue/devtools-core',
        '@vue/devtools-kit',
        'floating-vue',
        'comark',
        'comark/plugins/highlight',
        'comark/render',
        'shiki/langs/xml.mjs',
      ],
    },
  },
  experimental: {
    // Avoid Nuxt/Nitro registering competing server-side useAppConfig imports.
    serverAppConfig: false,
  },
  mdc: {
    highlight: {
      noApiRoute: false,
    },
  },
  runtimeConfig: {
    public: {
      mdc: {
        highlight: {
          noApiRoute: false,
        },
      },
    },
  },
  compatibilityDate: 'latest',
  site: {
    ...(siteUrl ? { url: siteUrl } : {}),
    name: 'ODX',
    description: 'Modern OData Developer Experience for Nuxt and SAP BTP',
  },
  ...(siteUrl ? { llms: { domain: siteUrl } } : {}),
  odata: {
    devtools: {
      enabled: false,
    },
    services: [
      {
        name: 'demo',
        url: './edmx/demo-v4.edmx',
        strategy: 'direct',
      },
    ],
  },
})
