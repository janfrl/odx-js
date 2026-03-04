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

interface ServiceBinding {
  credentials: {
    clientid: string
    clientsecret: string
    url: string
    uri?: string
  }
}

/**
 * Resolves real technical user credentials and target URL from the SAP BTP Destination Service.
 * Supports VCAP_SERVICES (on BTP) and individual env variables (local).
 */
export async function resolveBtpDestination(serviceName: string): Promise<BtpDestination> {
  const vcap = JSON.parse(process.env.VCAP_SERVICES || '{}')
  
  // 1. Extract Service Credentials (Destination & XSUAA)
  const destService = vcap.destination?.[0] || JSON.parse(process.env.NUXT_ODATA_BTP_DESTINATION_KEY || '{}')
  const xsuaaService = vcap.xsuaa?.[0] || JSON.parse(process.env.NUXT_ODATA_BTP_XSUAA_KEY || '{}')

  if (!destService?.credentials || !xsuaaService?.credentials) {
    // Fallback to mock for local dev if no keys are provided
    console.warn(`[@bc8-odx/proxy] No BTP Service Keys found. Falling back to mock for "${serviceName}"`)
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

    // 2. Get Access Token for Destination Service via XSUAA
    const auth = Buffer.from(`${clientid}:${clientsecret}`).toString('base64')
    const tokenRes = await ofetch<{ access_token: string }>(`${xsuaaUrl}/oauth/token`, {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}` },
      params: { grant_type: 'client_credentials' },
    })

    // 3. Fetch Destination Details
    const destData = await ofetch<any>(`${destApiUrl}/destination-configuration/v1/destinations/${serviceName}`, {
      headers: { Authorization: `Bearer ${tokenRes.access_token}` },
    })

    const config = destData.destinationConfiguration
    const authTokens = destData.authTokens

    return {
      name: serviceName,
      url: config.URL,
      user: config.User,
      password: config.Password,
      authTokens: authTokens?.map((t: any) => ({ value: t.value })),
    }
  }
  catch (err: any) {
    throw new Error(`Failed to resolve BTP destination "${serviceName}": ${err.message}`)
  }
}
