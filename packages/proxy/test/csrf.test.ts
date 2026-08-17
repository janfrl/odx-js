import { fetchWithCsrf, prepareSapCsrfHeaders, SapCsrfTokenError } from '@me-tools/odx-core'
import { ofetch } from 'ofetch'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('ofetch', async () => {
  const actual = await vi.importActual('ofetch') as any
  const mockOfetch = vi.fn() as any
  mockOfetch.create = actual.ofetch.create
  mockOfetch.raw = vi.fn()
  return { ofetch: mockOfetch }
})

describe('cSRF Utility', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('bypasses preflight for GET requests', async () => {
    await fetchWithCsrf('/api/data', { method: 'GET' })
    expect(ofetch.raw).not.toHaveBeenCalled()
    expect(ofetch).toHaveBeenCalledWith('/api/data', expect.objectContaining({ method: 'GET' }))
  })

  it('performs preflight and injects tokens for POST requests', async () => {
    // Mock the HEAD preflight response
    ;(ofetch.raw as any).mockResolvedValueOnce({
      headers: new Headers({
        'x-csrf-token': 'token-123',
        'set-cookie': 'sap-user-context=123; path=/',
      }),
    })

    await fetchWithCsrf('/api/data', { method: 'POST', headers: { 'X-Existing': 'foo' } })

    // Verify HEAD request
    expect(ofetch.raw).toHaveBeenCalledWith('/api/data', expect.objectContaining({
      method: 'HEAD',
      headers: expect.objectContaining({ 'x-csrf-token': 'Fetch' }),
    }))

    // Verify final POST request with injected headers
    expect(ofetch).toHaveBeenCalledWith('/api/data', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({
        'x-csrf-token': 'token-123',
        'cookie': 'sap-user-context=123',
        'x-existing': 'foo',
      }),
    }))
  })

  it('preserves multiple session cookies without splitting Expires dates', async () => {
    const headers = new Headers({
      'x-csrf-token': 'token-456',
    }) as Headers & { getSetCookie?: () => string[] }
    headers.getSetCookie = () => [
      'SAP_SESSIONID=first; Path=/; HttpOnly',
      'sap-usercontext=sap-client=100; Expires=Wed, 21 Oct 2030 07:28:00 GMT; Path=/',
    ]
    ;(ofetch.raw as any).mockResolvedValueOnce({ headers })

    const prepared = await prepareSapCsrfHeaders('/api/data', {
      method: 'PATCH',
      headers: {
        'cookie': 'existing=value; SAP_SESSIONID=stale',
        'if-match': 'W/"1"',
      },
    })

    expect(prepared).toMatchObject({
      'cookie': 'existing=value; SAP_SESSIONID=first; sap-usercontext=sap-client=100',
      'if-match': 'W/"1"',
      'x-csrf-token': 'token-456',
    })
  })

  it('parses combined Set-Cookie headers on runtimes without getSetCookie', async () => {
    const headers = {
      get(name: string) {
        if (name === 'x-csrf-token')
          return 'token-fallback'
        if (name === 'set-cookie')
          return 'first=one; Expires=Wed, 21 Oct 2030 07:28:00 GMT; Path=/, second=two; Path=/'
        return null
      },
    } as Headers
    ;(ofetch.raw as any).mockResolvedValueOnce({ headers })

    const prepared = await prepareSapCsrfHeaders('/api/data', { method: 'POST' })

    expect(prepared.cookie).toBe('first=one; second=two')
  })

  it('fails closed when a SAP preflight does not return a token', async () => {
    ;(ofetch.raw as any).mockResolvedValueOnce({ headers: new Headers() })

    await expect(
      prepareSapCsrfHeaders('/api/data', { method: 'DELETE' }),
    ).rejects.toBeInstanceOf(SapCsrfTokenError)
    expect(ofetch).not.toHaveBeenCalled()
  })

  it('supports GET token preflight without forwarding a mutation body', async () => {
    ;(ofetch.raw as any).mockResolvedValueOnce({
      headers: new Headers({ 'x-csrf-token': 'token-get' }),
    })

    await fetchWithCsrf('/api/data', {
      method: 'POST',
      body: { Name: 'Desk' },
    }, { fetchMethod: 'GET' })

    expect(ofetch.raw).toHaveBeenCalledWith('/api/data', expect.objectContaining({
      method: 'GET',
      headers: expect.objectContaining({ 'x-csrf-token': 'Fetch' }),
    }))
    expect(ofetch.raw).not.toHaveBeenCalledWith('/api/data', expect.objectContaining({
      body: expect.anything(),
    }))
  })
})
