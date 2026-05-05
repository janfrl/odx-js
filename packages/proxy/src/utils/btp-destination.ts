import { Buffer } from 'node:buffer'
import { createHash } from 'node:crypto'
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

interface DestinationCacheEntry {
  destination: BtpDestination
  expiresAt: number
  evictionTimer: ReturnType<typeof setTimeout>
}

const DESTINATION_CACHE_TTL_MS = 60_000
const destinationCache = new Map<string, DestinationCacheEntry>()

function createDestinationCacheKey(serviceName: string, userToken?: string): string {
  if (!userToken) {
    return `${serviceName}:technical`
  }

  const normalizedUserToken = userToken.replace('Bearer ', '')
  const userTokenHash = createHash('sha256').update(normalizedUserToken).digest('hex')
  return `${serviceName}:user:${userTokenHash}`
}

function getCachedDestination(cacheKey: string): BtpDestination | undefined {
  const cacheEntry = destinationCache.get(cacheKey)
  if (!cacheEntry) {
    return undefined
  }

  if (cacheEntry.expiresAt <= Date.now()) {
    clearTimeout(cacheEntry.evictionTimer)
    destinationCache.delete(cacheKey)
    return undefined
  }

  return cacheEntry.destination
}

function cacheDestination(cacheKey: string, destination: BtpDestination): void {
  const existingEntry = destinationCache.get(cacheKey)
  if (existingEntry) {
    clearTimeout(existingEntry.evictionTimer)
  }

  const cacheEntry: DestinationCacheEntry = {
    destination,
    expiresAt: Date.now() + DESTINATION_CACHE_TTL_MS,
    evictionTimer: setTimeout(() => {
      if (destinationCache.get(cacheKey) === cacheEntry) {
        destinationCache.delete(cacheKey)
      }
    }, DESTINATION_CACHE_TTL_MS),
  }

  cacheEntry.evictionTimer.unref?.()
  destinationCache.set(cacheKey, cacheEntry)
}

function isAbsoluteHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  }
  catch {
    return false
  }
}

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
  const cacheKey = createDestinationCacheKey(serviceName, userToken)
  const cachedDestination = getCachedDestination(cacheKey)
  if (cachedDestination) {
    return cachedDestination
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
    const destinationUrl = typeof config?.URL === 'string' ? config.URL.trim() : ''

    if (!destinationUrl) {
      throw new Error('invalid destination URL: destinationConfiguration.URL is missing or blank')
    }

    if (!isAbsoluteHttpUrl(destinationUrl)) {
      throw new Error('invalid destination URL: destinationConfiguration.URL must be an absolute HTTP(S) URL')
    }

    const resolvedDestination: BtpDestination = {
      name: serviceName,
      url: destinationUrl,
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

    cacheDestination(cacheKey, resolvedDestination)
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
