import { ofetch } from 'ofetch'

/**
 * Raw payload structure expected from the SAP XSUAA JWT token.
 */
export interface XsuaaPayload {
  userId: string
  userCompanies: Array<{
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
 * Transforms raw XSUAA company assignments into a structured policy-based user context.
 * Groups companies by their source system.
 */
export function parseXsuaaPolicies(payload: XsuaaPayload): UserContext {
  const policiesMap = new Map<string, string[]>()

  for (const entry of payload.userCompanies) {
    const action = entry.source
    if (!policiesMap.has(action)) {
      policiesMap.set(action, [])
    }
    policiesMap.get(action)!.push(entry.company)
  }

  const policies: PolicyRule[] = Array.from(policiesMap.entries()).map(([action, companies]) => ({
    action,
    subject: 'all',
    conditions: {
      companyCode: companies,
    },
  }))

  return {
    userId: payload.userId,
    policies,
  }
}
