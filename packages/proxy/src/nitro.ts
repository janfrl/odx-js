import type { ODataProxyConfig, ODataProxyHooks } from '@bc8-odx/core'
import { defineNitroModule } from 'nitropack/kit'

export default defineNitroModule({
  setup(nitro) {
    const config = (nitro.options as any).odata as ODataProxyConfig

    if (!config) {
      return
    }

    // Resolve handler path
    const handlerPath = new URL('./api/odata.ts', import.meta.url).href

    // Register the OData proxy handler as a file path
    nitro.options.handlers.push({
      route: `${config.basePath}/**`,
      handler: handlerPath,
    })

    // Inject hooks into context for every request
    nitro.hooks.hook('request', (event) => {
      event.context.odataHooks = nitro.hooks
      event.context.odataConfig = config
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
        handler: new URL(`./api/${h.handler}.ts`, import.meta.url).href,
      })
    }
  },
})

// Augment both nitropack and nitropack/runtime to ensure visibility in all environments
declare module 'nitropack' {
  interface NitroRuntimeHooks extends ODataProxyHooks {}
}

declare module 'nitropack/runtime' {
  interface NitroRuntimeHooks extends ODataProxyHooks {}
}
