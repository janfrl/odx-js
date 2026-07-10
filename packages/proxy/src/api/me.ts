import process from 'node:process'
import { defineEventHandler, getHeader } from 'h3'
import { enforceExplorerEndpointPolicy, isProductionExplorerRuntime } from '../utils/explorer-policy'

function getFirstString(value: unknown): string | undefined {
  const firstValue = Array.isArray(value) ? value[0] : value
  return typeof firstValue === 'string' ? firstValue : undefined
}

/**
 * Returns the current user's identity details using the official SAP security context methods.
 */
export default defineEventHandler(async (event) => {
  enforceExplorerEndpointPolicy(event, 'me')

  const authHeader = getHeader(event, 'authorization')
  const sc = event.context.securityContext
  const isProduction = isProductionExplorerRuntime()

  // 1. Unified Return via SAP Security Context (Real Cloud Flow)
  if (sc) {
    const authAttr = getFirstString(sc.getAttribute('auth'))
    let userCompanies: any[] = []
    if (authAttr) {
      try {
        userCompanies = JSON.parse(authAttr)
      }
      catch {
      }
    }

    const user = {
      Usermail: sc.getEmail?.() || '',
      Userid: getFirstString(sc.getAttribute('employee_id')) || sc.getLogonName?.() || '',
      Usercompany: getFirstString(sc.getAttribute('company_id')) || '',
      Usercompanies: userCompanies,
    }

    return isProduction ? user : { ...user, _raw: sc.getTokenInfo?.() }
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
        }
        catch {
        }

        return {
          Usermail: p.email || '',
          Userid: attr.employee_id?.[0] || p.user_id || p.sub || '',
          Usercompany: attr.company_id?.[0] || '',
          Usercompanies: userCompanies,
          _raw: p,
        }
      }
    }
    catch {
      // Ignore parsing errors locally
    }
  }

  // 3. Local Development Fallback: Provide a synthetic user to allow Explorer to work
  if (process.env.NODE_ENV !== 'production') {
    return {
      Usermail: 'john.doe@bechtle.com',
      Userid: 'JDOE',
      Usercompany: 'BECHTLE',
      Usercompanies: [{ id: '1000', name: 'Bechtle AG' }],
      _synthetic: true,
    }
  }

  // 4. Production Fallback: Unauthorized
  return {
    Usermail: '',
    Userid: 'ANONYMOUS',
    Usercompany: '',
    Usercompanies: [],
    _error: 'Unauthorized: Please access via Launchpad.',
  }
})
