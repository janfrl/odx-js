import { createError } from 'h3'
import { defineNitroPlugin } from 'nitropack/runtime'

export default defineNitroPlugin((nitro) => {
  // Service-specific logic for 'Core' service only
  nitro.hooks.hook('odx:proxy:request:Core' as any, ({ fetchOptions }: any) => {
    console.warn('[ODX Core] Specific interceptor active')

    // Access control policy for Core service
    const headers = (fetchOptions.headers as Record<string, string>) || {}
    if (headers.deny === 'true') {
      console.error(`[ODX Core] DENYING request because 'deny' header is active`)
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden by Core Service Policy',
        data: { reason: 'Deny header was set to true' },
      })
    }
  })
})
