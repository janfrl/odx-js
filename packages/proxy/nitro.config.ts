import { fileURLToPath } from 'node:url'
import { defineNitroConfig } from 'nitropack/config'
import { dirname, resolve } from 'pathe'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineNitroConfig({
  preset: 'node-server',
  srcDir: 'src',
  compatibilityDate: '2026-03-06',
  handlers: [
    { route: '/api/odx/**', handler: resolve(__dirname, './src/api/odata.ts') },
    { route: '/__odx__/logs', handler: resolve(__dirname, './src/api/logs.ts') },
    { route: '/__odx__/config', handler: resolve(__dirname, './src/api/config.ts') },
    { route: '/__odx__/generate', handler: resolve(__dirname, './src/api/generate.ts') },
    { route: '/__odx__/schema', handler: resolve(__dirname, './src/api/schema.ts') },
    { route: '/__odx__/me', handler: resolve(__dirname, './src/api/me.ts') },
  ],
})
