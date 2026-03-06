import { defineNitroConfig } from 'nitropack/config'

export default defineNitroConfig({
  preset: 'node-server',
  srcDir: 'src',
  handlers: [
    { route: '/api/odx/**', handler: './api/odata.ts' },
    { route: '/__odx__/logs', handler: './api/logs.ts' },
    { route: '/__odx__/config', handler: './api/config.ts' },
    { route: '/__odx__/generate', handler: './api/generate.ts' },
    { route: '/__odx__/schema', handler: './api/schema.ts' },
    { route: '/__odx__/me', handler: './api/me.ts' },
  ],
})
