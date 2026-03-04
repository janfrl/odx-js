import { fetchWithCsrf } from '@bc8-odx/core'
import { ofetch } from 'ofetch'
import { describe, expect, it, vi } from 'vitest'

vi.mock('ofetch', async () => {
  const actual = await vi.importActual('ofetch') as any
  const mockOfetch = vi.fn()
  mockOfetch.create = actual.ofetch.create
  mockOfetch.raw = vi.fn()
  return { ofetch: mockOfetch }
})

describe('cSRF Utility', () => {
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
        'X-Existing': 'foo',
      }),
    }))
  })
})
