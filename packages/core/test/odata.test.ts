import { describe, expect, it, vi } from 'vitest'
import { $odata } from '../src/odata'

describe('$odata fetcher', () => {
  it('constructs the correct URL for basic requests', async () => {
    const client = vi.fn().mockResolvedValue({ success: true })
    await $odata(client, 'MyService', 'GET', { entitySet: 'Products' })

    expect(client).toHaveBeenCalledWith('MyService/Products', expect.objectContaining({
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
})
