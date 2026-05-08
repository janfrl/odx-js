import fs from 'node:fs'
import { ofetch } from 'ofetch'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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

  function mockBtpBindings(): void {
    process.env.VCAP_SERVICES = JSON.stringify({
      destination: [{ credentials: { uri: 'https://dest.api' } }],
      xsuaa: [{ credentials: { url: 'https://uaa.api', clientid: 'id', clientsecret: 'sec' } }],
    })
  }

  beforeEach(() => {
    vi.resetAllMocks()
    process.env = { ...originalEnv }
    delete process.env.VCAP_SERVICES
    // Clear the internal cache by calling it with different params or just accept it for now
    // Since destinationCache is not exported, we'll test unique service names
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns mock destination when no VCAP_SERVICES are present', async () => {
    vi.mocked(fs.existsSync).mockReturnValue(false)

    const result = await resolveBtpDestination('MockService')

    expect(result.user).toBe('TECHNICAL_USER')
    expect(result.url).toBe('/sap/opu/odata/sap')
  })

  it('throws in production when strict missing-binding fallback is disabled', async () => {
    process.env.NODE_ENV = 'production'
    vi.mocked(fs.existsSync).mockReturnValue(false)

    await expect(resolveBtpDestination('MissingBindingsProductionService', undefined, {
      allowMissingBindingFallback: false,
    })).rejects.toThrow(
      'Failed to resolve BTP destination "MissingBindingsProductionService": Destination and XSUAA service bindings are required',
    )
    expect(ofetch).not.toHaveBeenCalled()
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
    mockBtpBindings()

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

  it('loads destination bindings from local default-env.json when VCAP_SERVICES is absent', async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true)
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({
      VCAP_SERVICES: {
        destination: [{ credentials: { uri: 'https://default-dest.api' } }],
        xsuaa: [{ credentials: { url: 'https://default-uaa.api', clientid: 'default-id', clientsecret: 'default-sec' } }],
      },
    }))

    vi.mocked(ofetch)
      .mockResolvedValueOnce({ access_token: 'default-token' })
      .mockResolvedValueOnce({
        destinationConfiguration: {
          URL: 'https://default-backend.example',
          ProxyType: 'Internet',
        },
      })

    const result = await resolveBtpDestination('DefaultEnvService')

    expect(result.url).toBe('https://default-backend.example')
    expect(ofetch).toHaveBeenCalledWith('https://default-uaa.api/oauth/token', expect.anything())
    expect(ofetch).toHaveBeenCalledWith(
      'https://default-dest.api/destination-configuration/v1/destinations/DefaultEnvService',
      expect.anything(),
    )
  })

  it('throws in production when Destination Service calls fail', async () => {
    process.env.NODE_ENV = 'production'
    mockBtpBindings()

    vi.mocked(ofetch).mockRejectedValueOnce(new Error('destination unavailable'))

    await expect(resolveBtpDestination('FailingProductionService')).rejects.toThrow(
      'Failed to resolve BTP destination "FailingProductionService": destination unavailable',
    )
  })

  it('throws in production when Destination Service omits the destination URL', async () => {
    process.env.NODE_ENV = 'production'
    mockBtpBindings()

    vi.mocked(ofetch)
      .mockResolvedValueOnce({ access_token: 'dest-token' })
      .mockResolvedValueOnce({
        destinationConfiguration: {
          ProxyType: 'Internet',
        },
      })

    await expect(resolveBtpDestination('MissingUrlProductionService')).rejects.toThrow(
      'Failed to resolve BTP destination "MissingUrlProductionService": invalid destination URL',
    )
  })

  it('throws in production when Destination Service returns a blank destination URL', async () => {
    process.env.NODE_ENV = 'production'
    mockBtpBindings()

    vi.mocked(ofetch)
      .mockResolvedValueOnce({ access_token: 'dest-token' })
      .mockResolvedValueOnce({
        destinationConfiguration: {
          URL: '   ',
          ProxyType: 'Internet',
        },
      })

    await expect(resolveBtpDestination('BlankUrlProductionService')).rejects.toThrow(
      'Failed to resolve BTP destination "BlankUrlProductionService": invalid destination URL',
    )
  })

  it('throws in production when Destination Service returns a javascript destination URL', async () => {
    process.env.NODE_ENV = 'production'
    mockBtpBindings()

    vi.mocked(ofetch)
      .mockResolvedValueOnce({ access_token: 'dest-token' })
      .mockResolvedValueOnce({
        destinationConfiguration: {
          URL: 'javascript:alert(1)',
          ProxyType: 'Internet',
        },
      })

    await expect(resolveBtpDestination('JavascriptUrlProductionService')).rejects.toThrow(
      'Failed to resolve BTP destination "JavascriptUrlProductionService": invalid destination URL',
    )
  })

  it('throws in production when Destination Service returns arbitrary text as the destination URL', async () => {
    process.env.NODE_ENV = 'production'
    mockBtpBindings()

    vi.mocked(ofetch)
      .mockResolvedValueOnce({ access_token: 'dest-token' })
      .mockResolvedValueOnce({
        destinationConfiguration: {
          URL: 'not a url',
          ProxyType: 'Internet',
        },
      })

    await expect(resolveBtpDestination('ArbitraryTextUrlProductionService')).rejects.toThrow(
      'Failed to resolve BTP destination "ArbitraryTextUrlProductionService": invalid destination URL',
    )
  })

  it('does not cache invalid production destination URLs', async () => {
    process.env.NODE_ENV = 'production'
    mockBtpBindings()

    vi.mocked(ofetch)
      .mockResolvedValueOnce({ access_token: 'first-dest-token' })
      .mockResolvedValueOnce({
        destinationConfiguration: {
          URL: 'file:///etc/passwd',
          ProxyType: 'Internet',
        },
      })
      .mockResolvedValueOnce({ access_token: 'second-dest-token' })
      .mockResolvedValueOnce({
        destinationConfiguration: {
          URL: 'https://valid-after-invalid.example',
          ProxyType: 'Internet',
        },
      })

    await expect(resolveBtpDestination('InvalidUrlNotCachedService')).rejects.toThrow(
      'Failed to resolve BTP destination "InvalidUrlNotCachedService": invalid destination URL',
    )

    const result = await resolveBtpDestination('InvalidUrlNotCachedService')

    expect(result.url).toBe('https://valid-after-invalid.example')
    expect(ofetch).toHaveBeenCalledTimes(4)
  })

  it('preserves local development fallback when Destination Service omits the destination URL', async () => {
    process.env.NODE_ENV = 'development'
    mockBtpBindings()

    vi.mocked(ofetch)
      .mockResolvedValueOnce({ access_token: 'dest-token' })
      .mockResolvedValueOnce({
        destinationConfiguration: {
          ProxyType: 'Internet',
        },
      })

    const result = await resolveBtpDestination('MissingUrlDevelopmentFallbackService')

    expect(result).toEqual({
      name: 'MissingUrlDevelopmentFallbackService',
      url: '/sap/opu/odata/sap',
      user: 'MOCK',
      password: 'MOCK',
    })
  })

  it('preserves local development fallback when Destination Service returns a non-http destination URL', async () => {
    process.env.NODE_ENV = 'development'
    mockBtpBindings()

    vi.mocked(ofetch)
      .mockResolvedValueOnce({ access_token: 'dest-token' })
      .mockResolvedValueOnce({
        destinationConfiguration: {
          URL: 'file:///etc/passwd',
          ProxyType: 'Internet',
        },
      })

    const result = await resolveBtpDestination('NonHttpUrlDevelopmentFallbackService')

    expect(result).toEqual({
      name: 'NonHttpUrlDevelopmentFallbackService',
      url: '/sap/opu/odata/sap',
      user: 'MOCK',
      password: 'MOCK',
    })
  })

  it('keeps technical and user-token destination cache entries separate', async () => {
    mockBtpBindings()

    vi.mocked(ofetch)
      .mockResolvedValueOnce({ access_token: 'technical-dest-token' })
      .mockResolvedValueOnce({
        destinationConfiguration: { URL: 'https://technical-backend.example' },
      })
      .mockResolvedValueOnce({ access_token: 'user-dest-token' })
      .mockResolvedValueOnce({
        destinationConfiguration: { URL: 'https://user-backend.example' },
      })

    const technicalResult = await resolveBtpDestination('CacheModeService')
    const userResult = await resolveBtpDestination('CacheModeService', 'Bearer user-jwt-123')

    expect(technicalResult.url).toBe('https://technical-backend.example')
    expect(userResult.url).toBe('https://user-backend.example')
    expect(ofetch).toHaveBeenCalledTimes(4)
  })

  it('does not reuse cached user-token destination data across different bearer tokens', async () => {
    mockBtpBindings()

    vi.mocked(ofetch)
      .mockResolvedValueOnce({ access_token: 'first-dest-token' })
      .mockResolvedValueOnce({
        destinationConfiguration: { URL: 'https://first-user-backend.example' },
        authTokens: [{ value: 'first-user-auth-token' }],
      })
      .mockResolvedValueOnce({ access_token: 'second-dest-token' })
      .mockResolvedValueOnce({
        destinationConfiguration: { URL: 'https://second-user-backend.example' },
        authTokens: [{ value: 'second-user-auth-token' }],
      })

    const firstResult = await resolveBtpDestination('PerUserCacheService', 'Bearer first-user-jwt')
    const secondResult = await resolveBtpDestination('PerUserCacheService', 'Bearer second-user-jwt')

    expect(firstResult.url).toBe('https://first-user-backend.example')
    expect(firstResult.authTokens?.[0].value).toBe('first-user-auth-token')
    expect(secondResult.url).toBe('https://second-user-backend.example')
    expect(secondResult.authTokens?.[0].value).toBe('second-user-auth-token')
    expect(ofetch).toHaveBeenCalledTimes(4)
  })

  it('reuses user-token destination cache entries before the bounded lifetime expires', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-05T10:00:00.000Z'))
    mockBtpBindings()

    vi.mocked(ofetch)
      .mockResolvedValueOnce({ access_token: 'cached-user-dest-token' })
      .mockResolvedValueOnce({
        destinationConfiguration: { URL: 'https://cached-user-backend.example' },
        authTokens: [{ value: 'cached-user-auth-token' }],
      })

    const firstResult = await resolveBtpDestination('UserCacheHitBeforeTtlService', 'Bearer cached-user-jwt')
    vi.advanceTimersByTime(59_000)
    const secondResult = await resolveBtpDestination('UserCacheHitBeforeTtlService', 'Bearer cached-user-jwt')

    expect(firstResult.url).toBe('https://cached-user-backend.example')
    expect(secondResult.url).toBe('https://cached-user-backend.example')
    expect(secondResult.authTokens?.[0].value).toBe('cached-user-auth-token')
    expect(ofetch).toHaveBeenCalledTimes(2)
  })

  it('expires user-token destination cache entries after the bounded lifetime', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-05T11:00:00.000Z'))
    mockBtpBindings()

    vi.mocked(ofetch)
      .mockResolvedValueOnce({ access_token: 'first-user-dest-token' })
      .mockResolvedValueOnce({
        destinationConfiguration: { URL: 'https://first-expiring-user-backend.example' },
        authTokens: [{ value: 'first-expiring-user-auth-token' }],
      })
      .mockResolvedValueOnce({ access_token: 'second-user-dest-token' })
      .mockResolvedValueOnce({
        destinationConfiguration: { URL: 'https://second-expiring-user-backend.example' },
        authTokens: [{ value: 'second-expiring-user-auth-token' }],
      })

    const firstResult = await resolveBtpDestination('UserCacheExpiresAfterTtlService', 'Bearer expiring-user-jwt')
    vi.advanceTimersByTime(60_001)
    const secondResult = await resolveBtpDestination('UserCacheExpiresAfterTtlService', 'Bearer expiring-user-jwt')

    expect(firstResult.url).toBe('https://first-expiring-user-backend.example')
    expect(firstResult.authTokens?.[0].value).toBe('first-expiring-user-auth-token')
    expect(secondResult.url).toBe('https://second-expiring-user-backend.example')
    expect(secondResult.authTokens?.[0].value).toBe('second-expiring-user-auth-token')
    expect(ofetch).toHaveBeenCalledTimes(4)
  })

  it('expires technical destination cache entries after the bounded lifetime', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-05T12:00:00.000Z'))
    mockBtpBindings()

    vi.mocked(ofetch)
      .mockResolvedValueOnce({ access_token: 'first-technical-dest-token' })
      .mockResolvedValueOnce({
        destinationConfiguration: { URL: 'https://first-expiring-technical-backend.example' },
      })
      .mockResolvedValueOnce({ access_token: 'second-technical-dest-token' })
      .mockResolvedValueOnce({
        destinationConfiguration: { URL: 'https://second-expiring-technical-backend.example' },
      })

    const firstResult = await resolveBtpDestination('TechnicalCacheExpiresAfterTtlService')
    vi.advanceTimersByTime(60_001)
    const secondResult = await resolveBtpDestination('TechnicalCacheExpiresAfterTtlService')

    expect(firstResult.url).toBe('https://first-expiring-technical-backend.example')
    expect(secondResult.url).toBe('https://second-expiring-technical-backend.example')
    expect(ofetch).toHaveBeenCalledTimes(4)
  })

  it('uses connectivity proxy defaults when OnPremise binding omits proxy host and port', async () => {
    process.env.VCAP_SERVICES = JSON.stringify({
      destination: [{ credentials: { uri: 'https://dest.api' } }],
      xsuaa: [{ credentials: { url: 'https://uaa.api', clientid: 'id', clientsecret: 'sec' } }],
      connectivity: [{ credentials: {
        url: 'https://conn-uaa.api',
        clientid: 'conn-id',
        clientsecret: 'conn-sec',
      } }],
    })

    vi.mocked(ofetch)
      .mockResolvedValueOnce({ access_token: 'dest-token' })
      .mockResolvedValueOnce({
        destinationConfiguration: {
          URL: 'http://onpremise-defaults:8000',
          ProxyType: 'OnPremise',
        },
      })
      .mockResolvedValueOnce({ access_token: 'conn-token' })

    const result = await resolveBtpDestination('OnPremDefaultsService', 'Bearer user-jwt-456')

    expect(result.connectivity).toEqual({
      host: 'connectivityproxy.internal.cf.eu10.hana.ondemand.com',
      port: 20003,
      token: 'conn-token',
      userToken: 'user-jwt-456',
    })
  })

  it('surfaces malformed VCAP_SERVICES without calling external services', async () => {
    process.env.VCAP_SERVICES = '{not-json'

    await expect(resolveBtpDestination('MalformedVcapService')).rejects.toThrow()
    expect(ofetch).not.toHaveBeenCalled()
  })
})
