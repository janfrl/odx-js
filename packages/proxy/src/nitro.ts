import type { ODataProxyConfig } from '@bc8-odx/core'
import { createResolver } from '@nuxt/kit'
import { defineNitroModule } from 'nitropack/kit'

export default defineNitroModule({
  setup(nitro) {
    const config = (nitro.options as any).odata as ODataProxyConfig
    const resolver = createResolver(import.meta.url)

    if (!config) {
      return
    }

    // Register handlers using absolute paths resolved via Nuxt resolver
    // This is the most reliable way to bridge the gap between Nuxt modules and Nitro
    nitro.options.handlers.push({
      route: `${config.basePath}/**`,
      handler: resolver.resolve('./api/odata.ts'),
    })

    // Also register the internal API handlers
    const internalHandlers = [
      { route: '/__odx__/logs', handler: './api/logs.ts' },
      { route: '/__odx__/config', handler: './api/config.ts' },
      { route: '/__odx__/generate', handler: './api/generate.ts' },
      { route: '/__odx__/schema', handler: './api/schema.ts' },
    ]

    for (const h of internalHandlers) {
      nitro.options.handlers.push({
        route: h.route,
        handler: resolver.resolve(h.handler),
      })
    }
  },
})
