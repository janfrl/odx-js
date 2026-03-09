import process from 'node:process'
import { fetchRealXsuaaToken, parseXsuaaPolicies } from '@bc8-odx/core'
import { createError, defineEventHandler, getHeader, setResponseHeader } from 'h3'

/**
 * Returns the user context.
 */
export default defineEventHandler(async (event) => {
  const authHeader = getHeader(event, 'authorization')
  const config = event.context.odataConfig

  // 1. Check for validated security context from SAP XSUAA Plugin
  if (event.context.securityContext) {
    const tokenInfo = event.context.securityContext.getTokenInfo()
    return {
      ...parseXsuaaPolicies(tokenInfo),
      _raw: tokenInfo,
    }
  }

  // 2. Fallback for Bearer Token (Manual)
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const payloadPart = authHeader.split(' ')[1]!.split('.')[1]
      if (payloadPart) {
        const payload = JSON.parse(atob(payloadPart))
        return {
          ...parseXsuaaPolicies(payload),
          _raw: payload,
        }
      }
    }
    catch (e) {
      console.error('[@bc8-odx/proxy] Failed to parse JWT in /me:', e)
    }
  }

  // 3. Local Development Flow
  // Only offer Basic Auth prompt and Token Exchange if NOT in Cloud Foundry
  const isCloud = !!process.env.VCAP_APPLICATION || !!process.env.VCAP_SERVICES
  
  if (!isCloud) {
    // 3a. Token Exchange via Config/Env
    if (config?.auth?.username && config?.auth?.password) {
      try {
        const defaultEnv = JSON.parse(process.env.NUXT_ODATA_BTP_XSUAA_KEY || '{}')
        if (defaultEnv.credentials) {
          const token = await fetchRealXsuaaToken(defaultEnv.credentials, config.auth.username, config.auth.password)
          const payloadPart = token.split('.')[1]!
          const payload = JSON.parse(atob(payloadPart))
          return {
            ...parseXsuaaPolicies(payload),
            _raw: payload,
          }
        }
      }
      catch (err: any) {
        console.error('[@bc8-odx/proxy] Local BTP Token Exchange failed:', err.message)
      }
    }

    // 3b. Browser Prompt
    setResponseHeader(event, 'WWW-Authenticate', 'Basic realm="ODX Explorer Login"')
  }

  throw createError({
    statusCode: 401,
    statusMessage: isCloud 
      ? 'Unauthorized: No JWT token provided by Approuter' 
      : 'Unauthorized: Please provide BTP credentials',
  })
})
