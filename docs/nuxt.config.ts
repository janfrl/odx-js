const siteUrl = 'https://odx.nuxt.com'

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
    url: siteUrl,
    name: 'ODX',
    description: 'Modern OData Developer Experience for Nuxt and SAP BTP',
  },
  llms: {
    domain: siteUrl,
  },
  assistant: false,
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
