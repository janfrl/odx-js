import { odataGuard } from '@bc8-odx/proxy'
import { defineNitroPlugin } from 'nitropack/runtime'

export default defineNitroPlugin((nitro) => {
  // Service-specific logic for 'Northwind' service only
  nitro.hooks.hook('odx:proxy:request:Northwind', (ctx) => {
    odataGuard(ctx)
      .denyIfPathIncludes('/Customers', 'Customers data is restricted')
      .denyIfHeader('deny', 'true', 'Forbidden by Northwind Service Policy')
  })
})
