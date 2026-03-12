import type { H3Event } from 'h3'
import { createRequire } from 'node:module'
import { createError, getHeader } from 'h3'

const require = createRequire(import.meta.url)
const xsenv = require('@sap/xsenv')
const { createSecurityContext, XsuaaService } = require('@sap/xssec')

// Load environment (e.g. from VCAP_SERVICES)
xsenv.loadEnv()

let xsuaaCredentials: any = null
try {
  xsuaaCredentials = xsenv.getServices({ xsuaa: { tag: 'xsuaa' } }).xsuaa
}
catch {
  // Silent fail if no XSUAA is bound (e.g. local dev without environment)
}

const authService = xsuaaCredentials ? new XsuaaService(xsuaaCredentials) : null

/**
 * Validates the JWT token in the Authorization header.
 * Attaches the security context to the event if successful.
 * @throws 401 Unauthorized if validation fails.
 */
export async function validateBtpAuth(event: H3Event): Promise<void> {
  // If no XSUAA service is bound, we might be in local dev or misconfigured.
  // In production BTP, this must be present.
  if (!authService) {
    // In local development, we might want to skip this or use a mock.
    // For now, if we want strict mode, we'd throw here, but let's be pragmatic.
    if (process.env.NODE_ENV === 'production') {
      throw createError({
        statusCode: 500,
        statusMessage: 'XSUAA service binding missing in production',
      })
    }
    return
  }

  const authorization = getHeader(event, 'authorization')
  if (!authorization) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authorization header missing',
    })
  }

  try {
    const secContext = await createSecurityContext([authService], {
      // @sap/xssec expects the raw request object (Node.js incoming message)
      req: event.node.req,
    })

    // Attach security context for further use in handlers (e.g. for principal propagation)
    event.context.securityContext = secContext
  }
  catch (err: any) {
    throw createError({
      statusCode: 401,
      statusMessage: err.message || 'Invalid JWT token',
    })
  }
}
