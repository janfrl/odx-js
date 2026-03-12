import process from 'node:process'
import { fetchRealXsuaaToken } from '@bc8-odx/core'
import { createError, defineEventHandler, getHeader, getHeaders, setResponseHeader } from 'h3'

/**
 * Returns the current user's identity details using the official SAP security context methods.
 */
export default defineEventHandler(async (event) => {
  const authHeader = getHeader(event, 'authorization')
  const config = event.context.odataConfig
  const sc = event.context.securityContext

  console.log('[@bc8-odx/proxy] /api/me request headers:', getHeaders(event))
  console.log('[@bc8-odx/proxy] /api/me securityContext present:', !!sc)

  // 1. Unified Return via SAP Security Context (Real Cloud Flow)
  if (sc) {
    const authAttr = sc.getAttribute('auth')?.[0]
    let userCompanies: any[] = []
    if (authAttr) {
      try {
        userCompanies = JSON.parse(authAttr)
      } catch (e) {}
    }

    return {
      Usermail: sc.getEmail() || '',
      Userid: sc.getAttribute('employee_id')?.[0] || sc.getLogonName() || '',
      Usercompany: sc.getAttribute('company_id')?.[0] || '',
      Usercompanies: userCompanies,
      _raw: sc.getTokenInfo()
    }
  }

  // 2. Manual decoding fallback (Approuter present but plugin skipped)
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const payloadPart = authHeader.split(' ')[1]!.split('.')[1]
      if (payloadPart) {
        const p = JSON.parse(atob(payloadPart))
        const attr = p['xs.user.attributes'] || {}
        let userCompanies: any[] = []
        try {
          userCompanies = JSON.parse(attr.auth?.[0] || '[]')
        } catch (e) {}

        return {
          Usermail: p.email || '',
          Userid: attr.employee_id?.[0] || p.user_id || p.sub || '',
          Usercompany: attr.company_id?.[0] || '',
          Usercompanies: userCompanies,
          _raw: p
        }
      }
    }
    catch (e) {
      console.error('[@bc8-odx/proxy] Failed to manually parse JWT in /me:', e)
    }
  }

  // 3. Local Development Flows (Token Exchange / Browser Prompt)
  const isCloud = !!process.env.VCAP_APPLICATION || !!process.env.VCAP_SERVICES
  
  if (!isCloud) {
    // Local Token Exchange Logic here... (bleibt wie bisher)
    if (config?.auth?.username && config?.auth?.password) {
      try {
        const xsuaaService = JSON.parse(process.env.NUXT_ODATA_BTP_XSUAA_KEY || '{}')
        if (xsuaaService.credentials) {
          const token = await fetchRealXsuaaToken(xsuaaService.credentials, config.auth.username, config.auth.password)
          const payloadPart = token.split('.')[1]!
          const p = JSON.parse(atob(payloadPart))
          // Recursive call or simple return for local dev...
          return { Usermail: p.email, Userid: p.user_id, Usercompany: '', Usercompanies: [], _raw: p }
        }
      } catch (err) {}
    }
    setResponseHeader(event, 'WWW-Authenticate', 'Basic realm="ODX Explorer Login"')
  }

  throw createError({
    statusCode: 401,
    statusMessage: isCloud 
      ? 'Unauthorized: No valid JWT token found. Please access via Launchpad.' 
      : 'Unauthorized: Please provide BTP credentials',
  })
})
