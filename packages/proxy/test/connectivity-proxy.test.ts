import { afterEach, describe, expect, it, vi } from 'vitest'
import { resolveConnectivityRequest } from '../src/utils/connectivity-proxy'

const { ProxyAgent } = vi.hoisted(() => {
  const close = vi.fn().mockResolvedValue(undefined)
  const ProxyAgent = vi.fn(function (this: { close: typeof close }, _options: unknown) {
    this.close = close
  })
  return { close, ProxyAgent }
})

vi.mock('undici', () => ({
  fetch: vi.fn(),
  ProxyAgent,
}))

describe('connectivity proxy request', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('creates an authenticated HTTP proxy dispatcher and principal propagation header', async () => {
    const request = await resolveConnectivityRequest({
      host: 'connectivity-proxy.internal',
      port: 20003,
      token: 'connectivity-token',
      userToken: 'user-token',
    })

    expect(ProxyAgent).toHaveBeenCalledWith({
      uri: 'http://connectivity-proxy.internal:20003',
      token: 'Bearer connectivity-token',
    })
    expect(request.dispatcher).toBeDefined()
    expect(request.fetch).toBeDefined()
    expect(request.headers).toEqual({
      'sap-connectivity-authentication': 'Bearer user-token',
    })
  })

  it('reuses a dispatcher only for the same endpoint and token', async () => {
    const first = await resolveConnectivityRequest({
      host: 'proxy-cache.internal',
      port: 20003,
      token: 'first-token',
    })
    const second = await resolveConnectivityRequest({
      host: 'proxy-cache.internal',
      port: 20003,
      token: 'first-token',
    })
    const rotated = await resolveConnectivityRequest({
      host: 'proxy-cache.internal',
      port: 20003,
      token: 'rotated-token',
    })

    expect(second.dispatcher).toBe(first.dispatcher)
    expect(rotated.dispatcher).not.toBe(first.dispatcher)
  })

  it('does not add Connectivity credentials to ordinary requests', async () => {
    await expect(resolveConnectivityRequest(undefined)).resolves.toEqual({})
  })
})
