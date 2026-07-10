import type { ODataProxyConfig } from '@bc8-odx/core'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineNitroModule } from 'nitropack/kit'
import { dirname, resolve } from 'pathe'
import './types'

const moduleDirectory = dirname(fileURLToPath(import.meta.url))
const sourceDirectory = existsSync(resolve(moduleDirectory, 'api/odata.ts'))
  ? moduleDirectory
  : resolve(moduleDirectory, '../src')

export default defineNitroModule({
  setup(nitro) {
    const config = (nitro.options as any).odata as ODataProxyConfig

    if (!config) {
      return
    }

    // Register handlers using absolute paths
    nitro.options.handlers.push({
      route: `${config.basePath}/**`,
      handler: resolve(sourceDirectory, './api/odata.ts'),
    })

    // Register BTP Auth plugins
    nitro.options.plugins = nitro.options.plugins || []
    nitro.options.plugins.push(resolve(sourceDirectory, './plugins/auth-btp.ts'))
    nitro.options.plugins.push(resolve(sourceDirectory, './plugins/btp-auth.ts'))

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
        handler: resolve(sourceDirectory, h.handler),
      })
    }
  },
})
