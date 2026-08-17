import { describe, expect, it, vi } from 'vitest'
import { $odata } from '../src/odata'

describe('$odata fetcher', () => {
  it('constructs the correct URL for basic requests', async () => {
    const client = vi.fn().mockResolvedValue({ success: true })
    await $odata(client, 'MyService', 'GET', { entitySet: 'Products' })

    expect(client).toHaveBeenCalledWith('MyService/Products', expect.objectContaining({
      headers: { accept: 'application/json' },
      method: 'GET',
    }))
  })

  it('handles requests without an entitySet', async () => {
    const client = vi.fn().mockResolvedValue({})
    await $odata(client, 'MyService', 'GET')

    expect(client).toHaveBeenCalledWith('MyService', expect.any(Object))
  })

  it('passes query parameters and body correctly', async () => {
    const client = vi.fn().mockResolvedValue({})
    const body = { Name: 'New Product' }
    const query = { $top: 1 }

    await $odata(client, 'S', 'POST', { entitySet: 'E', body, query })

    expect(client).toHaveBeenCalledWith('S/E', expect.objectContaining({
      method: 'POST',
      body,
      query,
    }))
  })
  it('forwards request options such as cancellation signals', async () => {
    const client = vi.fn().mockResolvedValue({ value: [] })
    const signal = new AbortController().signal

    await $odata(client, 'S', 'GET', {
      entitySet: 'E',
      query: { $top: 2 },
      signal,
    })

    expect(client).toHaveBeenCalledWith('S/E', {
      headers: { accept: 'application/json' },
      method: 'GET',
      query: { $top: 2 },
      signal,
    })
  })

  it('preserves explicit request headers and lets callers override the response format', async () => {
    const client = vi.fn().mockResolvedValue({ value: [] })

    await $odata(client, 'S', 'GET', {
      entitySet: 'E',
      headers: {
        'Accept': 'application/json;odata.metadata=minimal',
        'X-Correlation-ID': 'request-1',
      },
    })

    expect(client).toHaveBeenCalledWith('S/E', {
      headers: {
        'accept': 'application/json;odata.metadata=minimal',
        'x-correlation-id': 'request-1',
      },
      method: 'GET',
    })
  })
})
