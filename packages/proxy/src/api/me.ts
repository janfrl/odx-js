import process from 'node:process'
import type { XsuaaPayload } from '@bc8-odx/core'
import { fetchRealXsuaaToken, parseXsuaaPolicies } from '@bc8-odx/core'
import { createError, defineEventHandler, getHeader, setResponseHeader } from 'h3'

/**
 * Returns the current user's identity and calculated policies.
 * Supports:
 * 1. Bearer token from real Approuter
 * 2. Automatic login via username/password from config
 * 3. Browser-based Basic Auth prompt (fallback)
 */
export default defineEventHandler(async (event) => {
  const authHeader = getHeader(event, 'authorization')
  const config = event.context.odataConfig

  // 1. Standard Flow: Real JWT from Approuter
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const payloadPart = authHeader.split(' ')[1]!.split('.')[1]
      if (payloadPart) {
        const json = atob(payloadPart)
        const payload = JSON.parse(json) as XsuaaPayload
        return parseXsuaaPolicies(payload)
      }
    }
    catch (e) {
      console.error('[@bc8-odx/proxy] Failed to parse JWT in /me:', e)
    }
  }

  // 2. Local Dev: Check for Basic Auth (either from Browser prompt or Config)
  let username = config?.auth?.username
  let password = config?.auth?.password

  if (authHeader && authHeader.startsWith('Basic ')) {
    const credentials = atob(authHeader.split(' ')[1]!)
    const [u, p] = credentials.split(':')
    if (u && p) {
      username = u
      password = p
    }
  }

  // 3. Real Token Exchange via BTP XSUAA
  if (username && password) {
    try {
      const vcap = JSON.parse(process.env.VCAP_SERVICES || '{}')
      const xsuaaService = vcap.xsuaa?.[0] || JSON.parse(process.env.NUXT_ODATA_BTP_XSUAA_KEY || '{}')

      if (xsuaaService?.credentials) {
        console.warn(`[@bc8-odx/proxy] Local Dev: Fetching real XSUAA token for user "${username}"...`)
        const token = await fetchRealXsuaaToken(xsuaaService.credentials, username, password)

        const payloadPart = token.split('.')[1]!
        const json = atob(payloadPart)
        const payload = JSON.parse(json) as XsuaaPayload
        return parseXsuaaPolicies(payload)
      }
    }
    catch (err: any) {
      console.error('[@bc8-odx/proxy] BTP Token Exchange failed:', err.message)
      throw createError({
        statusCode: 401,
        statusMessage: `BTP Login failed: ${err.message}`,
      })
    }
  }

  // 4. Prompt for Credentials if nothing provided
  setResponseHeader(event, 'WWW-Authenticate', 'Basic realm="ODX Explorer Login"')
  throw createError({
    statusCode: 401,
    statusMessage: 'Unauthorized: Please provide BTP credentials',
  })
})
