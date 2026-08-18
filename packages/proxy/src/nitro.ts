import type { ODataProxyConfig } from '@me-tools/odx-core'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineNitroModule } from 'nitropack/kit'
import { dirname, resolve } from 'pathe'
import './types'

const moduleDirectory = dirname(fileURLToPath(import.meta.url))
const usesBuiltRuntime = existsSync(resolve(moduleDirectory, 'api/odata.mjs'))
const sourceDirectory = usesBuiltRuntime
  ? moduleDirectory
  : resolve(moduleDirectory, '../src')
const runtimeExtension = usesBuiltRuntime ? '.mjs' : '.ts'

export default defineNitroModule({
  setup(nitro) {
    const config = (nitro.options as any).odata as ODataProxyConfig

    if (!config) {
      return
    }

    // Register handlers using absolute paths
    nitro.options.handlers.push({
      route: `${config.basePath}/**`,
      handler: resolve(sourceDirectory, `./api/odata${runtimeExtension}`),
    })

    // Target resolution is portable. SAP XSUAA validation is a separate,
    // Node-only adapter and must be explicitly selected by the host.
    nitro.options.plugins = nitro.options.plugins || []
    nitro.options.externals.inline = nitro.options.externals.inline || []
    if (!nitro.options.externals.inline.includes(sourceDirectory))
      nitro.options.externals.inline.push(sourceDirectory)
    const btpAuthPlugin = resolve(sourceDirectory, `./plugins/btp-auth${runtimeExtension}`)
    nitro.options.plugins.push(btpAuthPlugin)
    if (config.security?.sapXsuaa) {
      const sapAuthPlugin = resolve(sourceDirectory, `./plugins/auth-btp${runtimeExtension}`)
      nitro.options.plugins.push(sapAuthPlugin)
    }

    // Also register the internal API handlers
    const internalHandlers = [
      { route: '/__odx__/logs', handler: './api/logs' },
      { route: '/__odx__/config', handler: './api/config' },
      { route: '/__odx__/generate', handler: './api/generate' },
      { route: '/__odx__/schema', handler: './api/schema' },
      { route: '/__odx__/types', handler: './api/types' },
      { route: '/__odx__/me', handler: './api/me' },
    ]

    for (const h of internalHandlers) {
      nitro.options.handlers.push({
        route: h.route,
        handler: resolve(sourceDirectory, `${h.handler}${runtimeExtension}`),
      })
    }
  },
})
