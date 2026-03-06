import { createResolver } from '@nuxt/kit'
import { defineNitroConfig } from 'nitropack/config'

const { resolve } = createResolver(import.meta.url)

export default defineNitroConfig({
  preset: 'node-server',
  srcDir: 'src',
  compatibilityDate: '2026-03-06',
  handlers: [
    { route: '/api/odx/**', handler: resolve('./src/api/odata.ts') },
    { route: '/__odx__/logs', handler: resolve('./src/api/logs.ts') },
    { route: '/__odx__/config', handler: resolve('./src/api/config.ts') },
    { route: '/__odx__/generate', handler: resolve('./src/api/generate.ts') },
    { route: '/__odx__/schema', handler: resolve('./src/api/schema.ts') },
    { route: '/__odx__/me', handler: resolve('./src/api/me.ts') },
  ],
})
