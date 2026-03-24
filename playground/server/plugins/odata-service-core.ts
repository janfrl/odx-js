import { createError } from 'h3'
import { defineNitroPlugin } from 'nitropack/runtime'

export default defineNitroPlugin((nitro) => {
  // Service-specific logic for 'Core' service only
  nitro.hooks.hook('odx:proxy:request:Core', ({ event, fetchOptions }) => {
    const addTrace = event.context.proxyTrace
    addTrace?.('Rules', 'Evaluating Core Service Policy...', { 
      service: 'Core',
      policy: 'HeaderGuard',
      required: { deny: 'false' }
    })

    // Access control policy for Core service
    const headers = (fetchOptions.headers as Record<string, string>) || {}
    if (headers.deny === 'true') {
      addTrace?.('Rules', 'Access DENIED: "deny" header is active', { headers, action: 'REJECT' }, 'error')
      console.error(`[ODX Core] DENYING request because 'deny' header is active`)
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden by Core Service Policy',
        data: { reason: 'Deny header was set to true' },
      })
    }

    addTrace?.('Rules', 'Core service policies passed', null, 'success')
  })
})
