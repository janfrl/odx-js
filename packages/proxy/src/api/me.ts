import process from 'node:process'
import { fetchRealXsuaaToken } from '@bc8-odx/core'
import { createError, defineEventHandler, getHeader, setResponseHeader } from 'h3'

/**
 * Returns the current user's raw XSUAA JWT payload.
 * Useful for inspecting roles, attributes, and identity details in dev.
 */
export default defineEventHandler(async (event) => {
  const authHeader = getHeader(event, 'authorization')
  const config = event.context.odataConfig

  // 1. Return real JWT payload from Approuter if present
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const payloadPart = authHeader.split(' ')[1]!.split('.')[1]
      if (payloadPart) {
        // Return raw JSON payload for inspection
        return JSON.parse(atob(payloadPart))
      }
    }
    catch (e) {
      console.error('[@bc8-odx/proxy] Failed to parse JWT in /me:', e)
    }
  }

  // 2. Real Token Exchange Fallback (Local Dev with BTP credentials)
  if (config?.auth?.username && config?.auth?.password) {
    try {
      const vcap = JSON.parse(process.env.VCAP_SERVICES || '{}')
      const xsuaaService = vcap.xsuaa?.[0] || JSON.parse(process.env.NUXT_ODATA_BTP_XSUAA_KEY || '{}')

      if (xsuaaService?.credentials) {
        const token = await fetchRealXsuaaToken(xsuaaService.credentials, config.auth.username, config.auth.password)
        const payloadPart = token.split('.')[1]!
        return JSON.parse(atob(payloadPart))
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

  // 3. Prompt for Credentials if nothing provided
  setResponseHeader(event, 'WWW-Authenticate', 'Basic realm="ODX Explorer Login"')
  throw createError({
    statusCode: 401,
    statusMessage: 'Unauthorized: Please provide BTP credentials to see user payload',
  })
})
