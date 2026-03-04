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
