import type { ODataProxyConfig } from '@me-tools/odx-core'
import type { H3Event } from 'h3'
import process from 'node:process'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { resolveBtpDestination } from '../src/utils/btp-destination'
import { resolveProxyTarget } from '../src/utils/target'

vi.mock('../src/utils/btp-destination', async importOriginal => ({
  ...await importOriginal<typeof import('../src/utils/btp-destination')>(),
  resolveBtpDestination: vi.fn(),
}))

describe('proxy target resolution', () => {
  const originalEnv = process.env
  const config: ODataProxyConfig = {
    basePath: '/api/odx',
    mode: 'sdk',
    services: [{
      name: 'BusinessPartner',
      url: '',
      destination: 'S4_BACKEND',
      strategy: 'proxied',
    }],
  }
  const event = {
    headers: new Headers(),
  } as H3Event

  beforeEach(() => {
    vi.resetAllMocks()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('fails closed when production destination resolution fails', async () => {
    process.env.NODE_ENV = 'production'
    vi.mocked(resolveBtpDestination).mockRejectedValue(new Error('destination unavailable'))

    await expect(resolveProxyTarget(event, config, 'BusinessPartner')).rejects.toThrow(
      'destination unavailable',
    )
    expect(resolveBtpDestination).toHaveBeenCalledWith('S4_BACKEND', undefined, {
      allowMissingBindingFallback: false,
      allowResolutionFailureFallback: false,
    })
  })

  it.each([
    ['staging'],
    [undefined],
  ])('fails closed when destination resolution fails with NODE_ENV %s', async (nodeEnv) => {
    if (nodeEnv === undefined)
      delete process.env.NODE_ENV
    else
      process.env.NODE_ENV = nodeEnv
    vi.mocked(resolveBtpDestination).mockRejectedValue(new Error('destination unavailable'))

    await expect(resolveProxyTarget(event, config, 'BusinessPartner')).rejects.toThrow(
      'destination unavailable',
    )
  })

  it('preserves the local development fallback', async () => {
    process.env.NODE_ENV = 'development'
    vi.mocked(resolveBtpDestination).mockRejectedValue(new Error('destination unavailable'))

    await expect(resolveProxyTarget(event, config, 'BusinessPartner')).resolves.toMatchObject({
      url: '/sap/opu/odata/sap',
      authHeader: '',
      isRelative: true,
    })
    expect(resolveBtpDestination).toHaveBeenCalledWith('S4_BACKEND', undefined, {
      allowMissingBindingFallback: true,
      allowResolutionFailureFallback: true,
    })
  })

  it('preserves Connectivity routing credentials from an OnPremise destination', async () => {
    process.env.NODE_ENV = 'production'
    vi.mocked(resolveBtpDestination).mockResolvedValue({
      name: 'S4_BACKEND',
      url: 'http://virtual-onpremise.internal:8000',
      proxyType: 'OnPremise',
      connectivity: {
        host: 'connectivity-proxy.internal',
        port: 20003,
        token: 'connectivity-token',
        userToken: 'user-token',
      },
    })

    await expect(resolveProxyTarget(event, config, 'BusinessPartner')).resolves.toMatchObject({
      url: 'http://virtual-onpremise.internal:8000',
      isRelative: false,
      connectivity: {
        host: 'connectivity-proxy.internal',
        port: 20003,
        token: 'connectivity-token',
        userToken: 'user-token',
      },
    })
  })
})
