import { odataGuard } from '@bc8-odx/proxy'
import { defineNitroPlugin } from 'nitropack/runtime'

export default defineNitroPlugin((nitro) => {
  // Service-specific logic for 'Core' service only
  nitro.hooks.hook('odx:proxy:request:Core', (ctx) => {
    odataGuard(ctx)
      .denyIfHeader('deny', 'true', 'Forbidden by Core Service Policy')
  })
})
