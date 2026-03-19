import { ofetch } from 'ofetch'

/**
 * Raw payload structure expected from the SAP XSUAA JWT token.
 * Supports both real XSUAA attributes and synthetic mock structures.
 */
export interface XsuaaPayload {
  'user_id'?: string
  'userId'?: string
  'email'?: string
  // Real XSUAA custom attributes are usually here
  'xs.user.attributes'?: Record<string, string[]>
  // Fallback for our mock structure
  'userCompanies'?: Array<{
    company: string
    source: string
    [key: string]: unknown
  }>
}

/**
 * Authorization rule mapping actions to subjects with specific conditions.
 */
export interface PolicyRule {
  action: string
  subject: string
  conditions: {
    companyCode: string[]
  }
}

/**
 * Application-specific user context derived from the authentication token.
 */
export interface UserContext {
  userId: string
  policies: PolicyRule[]
}

/**
 * Fetches a real JWT token from SAP BTP XSUAA using Password Grant.
 * Used for local testing with real user data.
 */
export async function fetchRealXsuaaToken(credentials: { clientid: string, clientsecret: string, url: string }, user: string, pass: string): Promise<string> {
  const auth = btoa(`${credentials.clientid}:${credentials.clientsecret}`)

  const res = await ofetch<{ access_token: string }>(`${credentials.url}/oauth/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'password',
      username: user,
      password: pass,
    }),
  })

  return res.access_token
}

/**
 * Transforms raw XSUAA data into a structured policy-based user context.
 * Robustly handles real BTP attributes and local mock formats.
 */
export function parseXsuaaPolicies(payload: XsuaaPayload): UserContext {
  const policies: PolicyRule[] = []
  const userId = payload.userId || payload.user_id || 'UNKNOWN'

  // 1. Handle Real BTP Attributes (from xs.user.attributes)
  const attributes = payload['xs.user.attributes']
  if (attributes) {
    // Example: If you have attributes like 'CompanyCode' or 'Source' in BTP
    // We map all found attributes to policies for flexibility
    for (const [key, values] of Object.entries(attributes)) {
      policies.push({
        action: key, // e.g. 'CompanyCode'
        subject: 'all',
        conditions: {
          companyCode: values,
        },
      })
    }
  }

  // 2. Handle Mock Format (Fallback)
  if (payload.userCompanies && Array.isArray(payload.userCompanies)) {
    const policiesMap = new Map<string, string[]>()
    for (const entry of payload.userCompanies) {
      const action = entry.source
      if (!policiesMap.has(action)) {
        policiesMap.set(action, [])
      }
      policiesMap.get(action)!.push(entry.company)
    }

    for (const [action, companies] of policiesMap.entries()) {
      policies.push({
        action,
        subject: 'all',
        conditions: {
          companyCode: companies,
        },
      })
    }
  }

  return {
    userId,
    policies,
  }
}
