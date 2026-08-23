import type { H3Event } from 'h3'
import { describe, expect, it, vi } from 'vitest'
import { createODataServerMutationService } from '../src/server'

function createEvent(fetch: typeof globalThis.fetch): H3Event {
  return {
    context: {
      odataConfig: {
        basePath: '/api/odx',
        buildDir: '.nuxt',
        mode: 'sdk',
        rootDir: '.',
        services: [{
          name: 'catalog',
          route: 'catalog-api',
          strategy: 'proxied',
          url: 'https://backend.example.test/odata',
        }],
      },
    },
    fetch,
  } as unknown as H3Event
}

function requestUrl(request: RequestInfo | URL): string {
  if (typeof request === 'string')
    return request
  return request instanceof URL ? request.href : request.url
}

describe('nitro server mutation service', () => {
  it('uses the request-scoped proxy route for entity, action, and relationship writes', async () => {
    const requestFetch = vi.fn<typeof globalThis.fetch>(async (request) => {
      const url = requestUrl(request)
      if (url.endsWith('/Products')) {
        return Response.json({ ID: 1, Name: 'Created' })
      }
      if (url.endsWith('/Demo.SetCategory')) {
        return Response.json({ Category: 'LIGHT' })
      }
      if (url.endsWith('/Products(1)')) {
        return Response.json({ deleted: true })
      }
      return new Response(null, { status: 204 })
    })
    const products = createODataServerMutationService(
      createEvent(requestFetch),
      'catalog',
    ).entitySet('Products')

    await expect(products.create<{ ID: number, Name: string }>({ Name: 'Created' }))
      .resolves
      .toEqual({ ID: 1, Name: 'Created' })
    await expect(products.invoke<{ Category: string }>('Demo.SetCategory', {
      key: 1,
      parameters: { Category: 'LIGHT' },
    }, {
      headers: { 'If-Match': 'W/"product-1"' },
    })).resolves.toEqual({ Category: 'LIGHT' })
    await products.linkNavigation(1, ['Reviews'], 'Reviews', 10)
    await products.unlinkNavigation(1, ['Reviews'], 10)
    await expect(products.remove<{ deleted: boolean }>(1, {
      headers: { 'If-Match': 'W/"product-2"' },
    })).resolves.toEqual({ deleted: true })

    expect(requestFetch).toHaveBeenCalledTimes(5)
    const requests = requestFetch.mock.calls.map(([request, init]) => ({
      url: requestUrl(request),
      method: init?.method,
      headers: new Headers(init?.headers),
      body: init?.body,
    }))
    expect(requests[0]).toMatchObject({
      url: '/api/odx/catalog-api/Products',
      method: 'POST',
      body: JSON.stringify({ Name: 'Created' }),
    })
    expect(requests[1]).toMatchObject({
      url: '/api/odx/catalog-api/Products(1)/Demo.SetCategory',
      method: 'POST',
      body: JSON.stringify({ Category: 'LIGHT' }),
    })
    expect(requests[1]!.headers.get('if-match')).toBe('W/"product-1"')
    expect(requests[2]).toMatchObject({
      url: '/api/odx/catalog-api/Products(1)/Reviews/$ref',
      method: 'POST',
      body: JSON.stringify({ '@odata.id': 'Reviews(10)' }),
    })
    expect(requests[3]).toMatchObject({
      url: '/api/odx/catalog-api/Products(1)/Reviews(10)/$ref',
      method: 'DELETE',
    })
    expect(requests[4]).toMatchObject({
      url: '/api/odx/catalog-api/Products(1)',
      method: 'DELETE',
    })
    expect(requests[4]!.headers.get('if-match')).toBe('W/"product-2"')
  })

  it('owns changeset serialization and response parsing inside ODX', async () => {
    const responseBody = [
      '--batch_response',
      'Content-Type: multipart/mixed; boundary=changeset_response',
      '',
      '--changeset_response',
      'Content-Type: application/http',
      'Content-Transfer-Encoding: binary',
      '',
      'HTTP/1.1 204 No Content',
      '',
      '',
      '--changeset_response',
      'Content-Type: application/http',
      'Content-Transfer-Encoding: binary',
      '',
      'HTTP/1.1 200 OK',
      'Content-Type: application/json',
      '',
      '{"ID":2,"Name":"Updated supplier"}',
      '--changeset_response--',
      '--batch_response--',
      '',
    ].join('\r\n')
    const requestFetch = vi.fn<typeof globalThis.fetch>(async () => new Response(responseBody, {
      headers: { 'Content-Type': 'multipart/mixed; boundary=batch_response' },
    }))
    const service = createODataServerMutationService(createEvent(requestFetch), 'catalog')

    const responses = await service.changeSet([{
      kind: 'update',
      entitySet: 'Products',
      key: 1,
      body: { Name: 'Updated product' },
      headers: { 'If-Match': 'W/"product-1"' },
    }, {
      kind: 'update-navigation',
      entitySet: 'Products',
      key: 1,
      navigationPath: ['Supplier'],
      targetKey: 2,
      body: { Name: 'Updated supplier' },
      headers: { 'If-Match': 'W/"supplier-2"' },
    }], {
      headers: { 'X-Correlation-ID': 'test-1' },
    })

    expect(responses).toEqual([{
      status: 204,
      headers: {},
    }, {
      status: 200,
      headers: { 'content-type': 'application/json' },
      body: { ID: 2, Name: 'Updated supplier' },
    }])
    expect(requestFetch).toHaveBeenCalledOnce()
    const [request, init] = requestFetch.mock.calls[0]!
    expect(requestUrl(request))
      .toBe('/api/odx/catalog-api/$batch')
    const headers = new Headers(init?.headers)
    expect(init?.method).toBe('POST')
    expect(headers.get('content-type')).toMatch(/^multipart\/mixed; boundary=batch_/u)
    expect(headers.get('x-correlation-id')).toBe('test-1')
    expect(init?.body).toContain('PATCH Products(1) HTTP/1.1')
    expect(init?.body).toContain('PATCH Products(1)/Supplier(2) HTTP/1.1')
    expect(init?.body).toContain('If-Match: W/"product-1"')
    expect(init?.body).toContain('If-Match: W/"supplier-2"')
  })

  it('fails closed for missing middleware and unknown services', () => {
    expect(() => createODataServerMutationService({ context: {} } as H3Event, 'catalog'))
      .toThrow('ODX server mutations require the Nuxt ODX server middleware.')
    expect(() => createODataServerMutationService(
      createEvent(vi.fn<typeof globalThis.fetch>()),
      'missing',
    )).toThrow('Unknown OData service "missing".')
  })
})
