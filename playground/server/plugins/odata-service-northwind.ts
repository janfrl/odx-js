import { createError } from 'h3'
import { defineNitroPlugin } from 'nitropack/runtime'

export default defineNitroPlugin((nitro) => {
  // Service-specific logic for 'Northwind' service only
  nitro.hooks.hook('odx:proxy:request:Northwind', ({ event, fetchOptions }) => {
    // 1. Entity-based blocking (Customers is forbidden)
    if (event.path.includes('/Customers')) {
      console.error('[ODX Northwind] DENYING request to Customers entity set')
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden: Customers data is restricted',
      })
    }

    // 2. Access control policy via 'deny' header
    const headers = (fetchOptions.headers as Record<string, string>) || {}
    if (headers.deny === 'true') {
      console.error(`[ODX Northwind] DENYING request because 'deny' header is active`)
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden by Northwind Service Policy',
        data: { reason: 'Deny header was set to true' },
      })
    }
  })
})
