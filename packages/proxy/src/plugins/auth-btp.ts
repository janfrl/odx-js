// @ts-ignore
import xsenv from '@sap/xsenv'
// @ts-ignore
import { createSecurityContext, XsuaaService } from '@sap/xssec'
import { createError } from 'h3'
import { defineNitroPlugin } from 'nitropack/runtime'

/**
 * Nitro plugin to enforce SAP XSUAA authentication using the modern XsuaaService class.
 * Matches the behavior of the legacy CAP/Express proxy.
 */
export default defineNitroPlugin((nitro) => {
  // Load XSUAA credentials via serviceCredentials (standard for deployed apps)
  let authService: any = null
  try {
    const xsuaaCreds = xsenv.serviceCredentials({ tag: 'xsuaa' })
    if (xsuaaCreds) {
      authService = new XsuaaService(xsuaaCreds)
    }
  }
  catch (e) {
    if (process.env.VCAP_SERVICES) {
      console.warn('[@bc8-odx/proxy] Could not initialize XsuaaService:', e)
    }
  }

  nitro.hooks.hook('request', async (event) => {
    // Only protect /api and /__odx__ routes
    if (!event.path.startsWith('/api/') && !event.path.startsWith('/__odx__/')) {
      return
    }

    // Skip validation in development or if no auth service found
    if (process.env.NODE_ENV !== 'production' || !authService || !process.env.VCAP_SERVICES) {
      return
    }

    try {
      // Validate using the raw node request, exactly like the legacy middleware
      // This automatically extracts the Bearer token and validates signatures
      const securityContext = await createSecurityContext([authService], {
        req: event.node.req,
      })

      // Store the official SAP context object in the request event
      event.context.securityContext = securityContext
    }
    catch (err: any) {
      console.error('[@bc8-odx/proxy] XSUAA Validation failed:', err.message)
      throw createError({
        statusCode: err.statusCode || 401,
        statusMessage: 'Unauthorized: Invalid XSUAA token',
      })
    }
  })
})
