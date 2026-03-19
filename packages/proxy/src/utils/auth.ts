import type { H3Event } from 'h3'
import { createRequire } from 'node:module'
import process from 'node:process'
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
  // 1. Skip validation entirely if not in production
  if (process.env.NODE_ENV !== 'production') {
    return
  }

  const authorization = getHeader(event, 'authorization')
  if (!authorization) {
    return // No token, no validation (dedicated mode)
  }

  if (!authService) {
    return
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
