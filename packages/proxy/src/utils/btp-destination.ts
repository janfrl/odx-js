import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { ofetch } from 'ofetch'

/**
 * Structure of a BTP Destination configuration.
 */
export interface BtpDestination {
  name: string
  url: string
  user?: string
  password?: string
  authTokens?: Array<{ value: string }>
}

// In-memory cache to prevent redundant BTP API calls and improve performance
const destinationCache = new Map<string, BtpDestination>()

/**
 * Loads VCAP_SERVICES from the environment (production) or local default-env.json (development).
 */
function getVcapServices(): any {
  if (process.env.VCAP_SERVICES) {
    return JSON.parse(process.env.VCAP_SERVICES)
  }

  try {
    const defaultEnvPath = path.resolve(process.cwd(), 'default-env.json')
    if (fs.existsSync(defaultEnvPath)) {
      const defaultEnv = JSON.parse(fs.readFileSync(defaultEnvPath, 'utf-8'))
      return defaultEnv.VCAP_SERVICES || {}
    }
  }
  catch (err) {
    console.warn('[@bc8-odx/proxy] Could not read local default-env.json:', err)
  }

  return {}
}

/**
 * Resolves technical user credentials and target URL from the SAP BTP Destination Service.
 * Uses an internal cache to minimize latency.
 */
export async function resolveBtpDestination(serviceName: string): Promise<BtpDestination> {
  if (destinationCache.has(serviceName)) {
    return destinationCache.get(serviceName)!
  }

  const vcap = getVcapServices()
  const destService = vcap.destination?.[0]
  const xsuaaService = vcap.xsuaa?.[0]

  if (!destService?.credentials || !xsuaaService?.credentials) {
    console.warn(`[@bc8-odx/proxy] No BTP Service bindings found. Falling back to mock for "${serviceName}"`)
    return {
      name: serviceName,
      url: 'https://mock-backend.btp.example.com/sap/opu/odata/sap',
      user: 'TECHNICAL_USER',
      password: 'MOCK_PASSWORD',
    }
  }

  try {
    const { clientid, clientsecret, url: xsuaaUrl } = xsuaaService.credentials
    const { uri: destApiUrl } = destService.credentials

    const auth = Buffer.from(`${clientid}:${clientsecret}`).toString('base64')
    const tokenRes = await ofetch<{ access_token: string }>(`${xsuaaUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ grant_type: 'client_credentials' }),
    })

    const destData = await ofetch<any>(`${destApiUrl}/destination-configuration/v1/destinations/${serviceName}`, {
      headers: { Authorization: `Bearer ${tokenRes.access_token}` },
    })

    const config = destData.destinationConfiguration
    const authTokens = destData.authTokens

    const resolvedDestination: BtpDestination = {
      name: serviceName,
      url: config.URL,
      user: config.User,
      password: config.Password,
      authTokens: authTokens?.map((t: any) => ({ value: t.value })),
    }

    destinationCache.set(serviceName, resolvedDestination)
    return resolvedDestination
  }
  catch (err: any) {
    throw new Error(`Failed to resolve BTP destination "${serviceName}": ${err.message}`)
  }
}
