import type { ODataProxyConfig } from '@bc8-odx/core'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineNitroModule } from 'nitropack/kit'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineNitroModule({
  setup(nitro) {
    const config = (nitro.options as any).odata as ODataProxyConfig

    if (!config) {
      return
    }

    // Resolve handler path
    const handlerPath = resolve(__dirname, './api/odata.ts')

    // Register the OData proxy handler as a file path
    nitro.options.handlers.push({
      route: `${config.basePath}/**`,
      handler: handlerPath,
    })

    // Also register the internal API handlers
    const internalHandlers = [
      { route: '/__odx__/logs', handler: 'logs' },
      { route: '/__odx__/config', handler: 'config' },
      { route: '/__odx__/generate', handler: 'generate' },
      { route: '/__odx__/schema', handler: 'schema' },
    ]

    for (const h of internalHandlers) {
      nitro.options.handlers.push({
        route: h.route,
        handler: resolve(__dirname, `./api/${h.handler}.ts`),
      })
    }
  },
})
