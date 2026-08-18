import { describe, expect, it, vi } from 'vitest'
import { $odata, $odataMutationWithResponse, $odataPage, $odataWithResponse } from '../src/odata'

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

  it('preserves OData enumeration member names in JSON action bodies', async () => {
    const client = vi.fn().mockResolvedValue({})
    const body = Object.freeze({ Priority: 'Urgent' })

    await $odata(client, 'S/Demo.SetPriority', 'POST', { body })

    expect(client).toHaveBeenCalledWith('S/Demo.SetPriority', {
      body,
      headers: { accept: 'application/json' },
      method: 'POST',
    })
    expect(JSON.stringify(client.mock.calls[0]?.[1]?.body))
      .toBe('{"Priority":"Urgent"}')
  })

  it('preserves structured OData action parameters as nested JSON objects', async () => {
    const client = vi.fn().mockResolvedValue({})
    const contact = Object.freeze({
      Name: 'Ada',
      Note: null,
      Role: 'Owner',
    })
    const body = Object.freeze({ Contact: contact })

    await $odata(client, 'S/Demo.SetContact', 'POST', { body })

    expect(client).toHaveBeenCalledWith('S/Demo.SetContact', {
      body,
      headers: { accept: 'application/json' },
      method: 'POST',
    })
    expect(client.mock.calls[0]?.[1]?.body).toBe(body)
    expect(JSON.stringify(client.mock.calls[0]?.[1]?.body))
      .toBe('{"Contact":{"Name":"Ada","Note":null,"Role":"Owner"}}')
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

describe('$odataPage fetcher', () => {
  it('preserves a safe continuation query without exposing the backend link', async () => {
    const client = vi.fn().mockResolvedValue({
      d: {
        results: [{ ID: 1 }],
        __next: 'https://private.sap.example/Products?%24skiptoken=next-1',
      },
    })

    const page = await $odataPage<{ ID: number }>(client, 'S', {
      entitySet: 'Products',
      query: { $top: 1 },
    })

    expect(page).toEqual({
      items: [{ ID: 1 }],
      continuation: { token: '%24skiptoken=next-1' },
    })
    expect(client).toHaveBeenCalledWith('S/Products', {
      headers: { accept: 'application/json' },
      method: 'GET',
      query: { $top: 1 },
    })
  })
})

describe('$odataWithResponse fetcher', () => {
  const createClient = (body: unknown, etag: string | null = null) => ({
    raw: vi.fn().mockResolvedValue({
      _data: body,
      headers: { get: vi.fn().mockReturnValue(etag) },
    }),
  })

  it('preserves the response ETag without exposing transport headers', async () => {
    const client = createClient({ d: { ID: 1, Name: 'Desk' } }, 'W/"header-1"')

    const response = await $odataWithResponse<{ ID: number, Name: string }>(
      client,
      'S/Products(1)',
      'GET',
      { query: { $select: 'ID,Name' } },
    )

    expect(response).toEqual({
      data: { ID: 1, Name: 'Desk' },
      etag: 'W/"header-1"',
    })
    expect(client.raw).toHaveBeenCalledWith('S/Products(1)', {
      headers: { accept: 'application/json' },
      method: 'GET',
      query: { $select: 'ID,Name' },
    })
  })

  it('preserves conditional PATCH options and the next entity ETag', async () => {
    const client = createClient({ d: { ID: 1, Name: 'Standing Desk' } }, 'W/"entity-2"')
    const headers = { 'If-Match': 'W/"entity-1"' }

    await expect($odataMutationWithResponse<{ ID: number, Name: string }>(
      client,
      'S/Products(1)',
      'PATCH',
      { body: { Name: 'Standing Desk' }, headers },
    )).resolves.toEqual({
      data: { ID: 1, Name: 'Standing Desk' },
      etag: 'W/"entity-2"',
    })
    expect(client.raw).toHaveBeenCalledWith('S/Products(1)', {
      body: { Name: 'Standing Desk' },
      headers: {
        'accept': 'application/json',
        'if-match': 'W/"entity-1"',
      },
      method: 'PATCH',
    })
  })

  it('preserves a PATCH ETag when the service returns 204 without a body', async () => {
    const client = createClient(undefined, 'W/"entity-2"')
    const response = await $odataMutationWithResponse(
      client,
      'S/Products(1)',
      'PATCH',
    )

    expect(response).toEqual({ etag: 'W/"entity-2"' })
  })

  it('preserves conditional MERGE options and the next entity ETag', async () => {
    const client = createClient({ d: { ID: 1, Name: 'Standing Desk' } }, 'W/"entity-2"')

    const response = await $odataMutationWithResponse<{ ID: number, Name: string }>(
      client,
      'S/Products(1)',
      'MERGE',
      {
        body: { Name: 'Standing Desk' },
        headers: { 'If-Match': 'W/"entity-1"' },
      },
    )

    expect(response).toEqual({
      data: { ID: 1, Name: 'Standing Desk' },
      etag: 'W/"entity-2"',
    })
    expect(client.raw).toHaveBeenCalledWith('S/Products(1)', {
      body: { Name: 'Standing Desk' },
      headers: {
        'accept': 'application/json',
        'if-match': 'W/"entity-1"',
      },
      method: 'MERGE',
    })
  })

  it('prefers the HTTP ETag over body metadata', async () => {
    const client = createClient({
      d: {
        __metadata: { etag: 'W/"body-1"' },
        ID: 1,
      },
    }, 'W/"header-1"')

    await expect($odataWithResponse(client, 'S/Products(1)')).resolves.toEqual({
      data: { ID: 1 },
      etag: 'W/"header-1"',
    })
  })

  it.each([
    [{ '@odata.etag': 'W/"v4-1"', 'ID': 1 }, 'W/"v4-1"'],
    [{ d: { __metadata: { etag: 'W/"v2-1"' }, ID: 1 } }, 'W/"v2-1"'],
  ])('falls back to an OData body ETag', async (body, etag) => {
    const response = await $odataWithResponse<{ ID: number }>(createClient(body), 'S/Products(1)')

    expect(response.data.ID).toBe(1)
    expect(response.etag).toBe(etag)
  })

  it('omits the ETag when no valid validator is present', async () => {
    const response = await $odataWithResponse(createClient({ d: { ID: 1 } }), 'S/Products(1)')

    expect(response).toEqual({ data: { ID: 1 } })
  })
})
