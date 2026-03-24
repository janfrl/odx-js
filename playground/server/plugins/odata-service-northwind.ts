import { createError } from 'h3'
import { defineNitroPlugin } from 'nitropack/runtime'

export default defineNitroPlugin((nitro) => {
  // Service-specific logic for 'Northwind' service only
  nitro.hooks.hook('odx:proxy:request:Northwind', ({ event, fetchOptions }) => {
    const addTrace = event.context.proxyTrace

    // 1. Entity-based blocking (Customers is forbidden)
    addTrace?.('Rules', 'Evaluating Entity Access Policy...', { 
      service: 'Northwind',
      policy: 'EntityRestricted',
      restricted: ['/Customers']
    })
    if (event.path.includes('/Customers')) {
      addTrace?.('Rules', 'Access DENIED: Customers entity is restricted', { path: event.path, action: 'REJECT' }, 'error')
      console.error('[ODX Northwind] DENYING request to Customers entity set')
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden: Customers data is restricted',
      })
    }

    // 2. Access control policy via 'deny' header
    const headers = (fetchOptions.headers as Record<string, string>) || {}
    addTrace?.('Rules', 'Checking Access Control Headers...', {
      policy: 'HeaderGuard',
      required: { deny: 'false' }
    })
    if (headers.deny === 'true') {
      addTrace?.('Rules', 'Access DENIED: "deny" header is active', { headers, action: 'REJECT' }, 'error')
      console.error(`[ODX Northwind] DENYING request because 'deny' header is active`)
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden by Northwind Service Policy',
        data: { reason: 'Deny header was set to true' },
      })
    }

    addTrace?.('Rules', 'All service policies passed', null, 'success')
  })
})
