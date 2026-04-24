import type { ODataProxyConfig } from '@bc8-odx/core'
import { fileURLToPath } from 'node:url'
import { defineNitroModule } from 'nitropack/kit'
import { dirname, resolve } from 'pathe'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineNitroModule({
  setup(nitro) {
    const config = (nitro.options as any).odata as ODataProxyConfig

    if (!config) {
      return
    }

    // Register handlers using absolute paths
    nitro.options.handlers.push({
      route: `${config.basePath}/**`,
      handler: resolve(__dirname, './api/odata.ts'),
    })

    // Register BTP Auth plugins
    nitro.options.plugins = nitro.options.plugins || []
    nitro.options.plugins.push(resolve(__dirname, './plugins/auth-btp.ts'))
    nitro.options.plugins.push(resolve(__dirname, './plugins/btp-auth.ts'))

    // Also register the internal API handlers
    const internalHandlers = [
      { route: '/__odx__/logs', handler: './api/logs.ts' },
      { route: '/__odx__/config', handler: './api/config.ts' },
      { route: '/__odx__/generate', handler: './api/generate.ts' },
      { route: '/__odx__/schema', handler: './api/schema.ts' },
      { route: '/__odx__/types', handler: './api/types.ts' },
      { route: '/__odx__/me', handler: './api/me.ts' },
    ]

    for (const h of internalHandlers) {
      nitro.options.handlers.push({
        route: h.route,
        handler: resolve(__dirname, h.handler),
      })
    }
  },
})
