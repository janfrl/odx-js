import fs from 'node:fs'
import { ofetch } from 'ofetch'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { resolveBtpDestination } from '../src/utils/btp-destination'

vi.mock('ofetch', () => ({
  ofetch: vi.fn(),
}))

vi.mock('node:fs', () => ({
  default: {
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
  },
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
}))

describe('btp Destination Resolution', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.clearAllMocks()
    process.env = { ...originalEnv }
    delete process.env.VCAP_SERVICES
    // Clear the internal cache by calling it with different params or just accept it for now
    // Since destinationCache is not exported, we'll test unique service names
  })

  it('returns mock destination when no VCAP_SERVICES are present', async () => {
    vi.mocked(fs.existsSync).mockReturnValue(false)

    const result = await resolveBtpDestination('MockService')

    expect(result.user).toBe('TECHNICAL_USER')
    expect(result.url).toBe('/sap/opu/odata/sap')
  })

  it('resolves a standard internet destination', async () => {
    process.env.VCAP_SERVICES = JSON.stringify({
      destination: [{ credentials: { uri: 'https://dest.api' } }],
      xsuaa: [{ credentials: { url: 'https://uaa.api', clientid: 'id', clientsecret: 'sec' } }],
    })

    vi.mocked(ofetch)
      .mockResolvedValueOnce({ access_token: 'token1' }) // XSUAA token
      .mockResolvedValueOnce({ // Destination data
        destinationConfiguration: {
          URL: 'https://backend.com',
          User: 'backend-user',
          Password: 'backend-password',
          ProxyType: 'Internet',
        },
        authTokens: [{ value: 'auth-token-123' }],
      })

    const result = await resolveBtpDestination('RealService')

    expect(result.url).toBe('https://backend.com')
    expect(result.user).toBe('backend-user')
    expect(result.authTokens?.[0].value).toBe('auth-token-123')

    expect(ofetch).toHaveBeenCalledWith('https://uaa.api/oauth/token', expect.anything())
    expect(ofetch).toHaveBeenCalledWith('https://dest.api/destination-configuration/v1/destinations/RealService', expect.anything())
  })

  it('handles OnPremise connectivity service', async () => {
    process.env.VCAP_SERVICES = JSON.stringify({
      destination: [{ credentials: { uri: 'https://dest.api' } }],
      xsuaa: [{ credentials: { url: 'https://uaa.api', clientid: 'id', clientsecret: 'sec' } }],
      connectivity: [{ credentials: {
        onpremise_proxy_host: 'proxy.host',
        onpremise_proxy_port: '1234',
        url: 'https://conn-uaa.api',
        clientid: 'conn-id',
        clientsecret: 'conn-sec',
      } }],
    })

    vi.mocked(ofetch)
      .mockResolvedValueOnce({ access_token: 'dest-token' }) // Destination XSUAA
      .mockResolvedValueOnce({ // Destination configuration
        destinationConfiguration: {
          URL: 'http://onpremise:8000',
          ProxyType: 'OnPremise',
        },
      })
      .mockResolvedValueOnce({ access_token: 'conn-token' }) // Connectivity XSUAA

    const result = await resolveBtpDestination('OnPremService')

    expect(result.proxyType).toBe('OnPremise')
    expect(result.connectivity).toBeDefined()
    expect(result.connectivity?.host).toBe('proxy.host')
    expect(result.connectivity?.port).toBe(1234)
    expect(result.connectivity?.token).toBe('conn-token')
  })

  it('supports principal propagation via user token', async () => {
    process.env.VCAP_SERVICES = JSON.stringify({
      destination: [{ credentials: { uri: 'https://dest.api' } }],
      xsuaa: [{ credentials: { url: 'https://uaa.api', clientid: 'id', clientsecret: 'sec' } }],
    })

    vi.mocked(ofetch)
      .mockResolvedValueOnce({ access_token: 'dest-token' })
      .mockResolvedValueOnce({
        destinationConfiguration: { URL: 'https://backend' },
      })

    await resolveBtpDestination('PropService', 'Bearer user-jwt-123')

    expect(ofetch).toHaveBeenCalledWith(
      expect.stringContaining('/destinations/PropService'),
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-user-token': 'user-jwt-123',
        }),
      }),
    )
  })
})
