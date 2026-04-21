const DOCUS_CSS_RE = /\\/g

export default defineNuxtConfig({
  extends: ['docus'],
  modules: ['@bc8-odx/nuxt'],
  compatibilityDate: '2026-04-21',
  site: {
    name: 'ODX',
    description: 'Modern OData Developer Experience for Nuxt and SAP BTP',
  },
  odata: {
    // Disable devtools in docs site to avoid potential conflicts with Docus
    devtools: {
      enabled: false,
    },
  },
  hooks: {
    'css:config': (css) => {
      css.forEach((c, i) => {
        if (typeof c === 'string' && c.includes('docus.css')) {
          // Normalize Windows paths to avoid 404s in dev
          css[i] = c.replace(DOCUS_CSS_RE, '/')
        }
      })
    },
  },
})
