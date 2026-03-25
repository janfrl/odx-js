import { Buffer } from 'node:buffer'
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
  proxyType?: 'Internet' | 'OnPremise'
  connectivity?: {
    host: string
    port: number
    token: string
    userToken?: string
  }
}

const destinationCache = new Map<string, BtpDestination>()

/**
 * Loads VCAP_SERVICES from the environment or local default-env.json.
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
  catch {
    // Silent fail
  }

  return {}
}

/**
 * Fetches an XSUAA token for service-to-service communication.
 */
async function fetchXsuaaToken(credentials: any, grantType: string = 'client_credentials', userToken?: string): Promise<string> {
  const { clientid, clientsecret, url } = credentials
  const auth = Buffer.from(`${clientid}:${clientsecret}`).toString('base64')

  const body = new URLSearchParams({ grant_type: grantType })
  if (userToken) {
    body.append('assertion', userToken.replace('Bearer ', ''))
  }

  const res = await ofetch<{ access_token: string }>(`${url}/oauth/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  })

  return res.access_token
}

/**
 * Resolves technical user credentials and target URL from the SAP BTP Destination Service.
 * Supports Principal Propagation via userToken exchange and Connectivity Service for OnPremise targets.
 */
export async function resolveBtpDestination(serviceName: string, userToken?: string): Promise<BtpDestination> {
  const cacheKey = `${serviceName}:${userToken ? 'user' : 'technical'}`
  if (destinationCache.has(cacheKey)) {
    return destinationCache.get(cacheKey)!
  }

  const vcap = getVcapServices()
  const destService = vcap.destination?.[0]
  const xsuaaService = vcap.xsuaa?.[0]
  const connectivityService = vcap.connectivity?.[0]

  if (!destService?.credentials || !xsuaaService?.credentials) {
    if (process.env.NODE_ENV === 'production') {
      console.warn(`[@bc8-odx/proxy] No BTP Service bindings found for "${serviceName}"`)
    }
    return {
      name: serviceName,
      url: '/sap/opu/odata/sap',
      user: 'TECHNICAL_USER',
      password: 'MOCK_PASSWORD',
    }
  }

  try {
    const { uri: destApiUrl } = destService.credentials

    // 1. Get Access Token for Destination API
    // If userToken is provided, we might need a token exchange, but usually
    // the Destination API itself is called with a client_credentials token.
    const destAccessToken = await fetchXsuaaToken(xsuaaService.credentials)

    // 2. Fetch Destination Configuration
    const destHeaders: Record<string, string> = {
      Authorization: `Bearer ${destAccessToken}`,
    }

    if (userToken) {
      destHeaders['X-user-token'] = userToken.replace('Bearer ', '')
    }

    const destData = await ofetch<any>(`${destApiUrl}/destination-configuration/v1/destinations/${serviceName}`, {
      headers: destHeaders,
    })

    const config = destData.destinationConfiguration
    const authTokens = destData.authTokens

    const resolvedDestination: BtpDestination = {
      name: serviceName,
      url: config.URL,
      user: config.User,
      password: config.Password,
      authTokens: authTokens?.map((t: any) => ({ value: t.value })),
      proxyType: config.ProxyType,
    }

    // 3. Handle OnPremise Connectivity
    if (config.ProxyType === 'OnPremise' && connectivityService) {
      const connCreds = connectivityService.credentials
      const connToken = await fetchXsuaaToken(connCreds)

      resolvedDestination.connectivity = {
        host: connCreds.onpremise_proxy_host || 'connectivityproxy.internal.cf.eu10.hana.ondemand.com',
        port: Number.parseInt(connCreds.onpremise_proxy_port || '20003'),
        token: connToken,
        userToken: userToken?.replace('Bearer ', ''),
      }
    }

    destinationCache.set(cacheKey, resolvedDestination)
    return resolvedDestination
  }
  catch (err: any) {
    if (process.env.NODE_ENV !== 'production') {
      return {
        name: serviceName,
        url: '/sap/opu/odata/sap',
        user: 'MOCK',
        password: 'MOCK',
      }
    }
    throw new Error(`Failed to resolve BTP destination "${serviceName}": ${err.message}`)
  }
}
