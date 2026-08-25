import type { H3Event } from 'h3'
import { describe, expect, it, vi } from 'vitest'
import { createODataServerReadService } from '../src/server'

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

describe('nitro server read service', () => {
  it('reads exact entities and preserves response validators on structured paths', async () => {
    const requestFetch = vi.fn<typeof globalThis.fetch>(async (request) => {
      const url = requestUrl(request)
      const name = url.includes('/Supplier')
        ? 'Acme'
        : url.includes('/Attachments')
          ? 'manual.pdf'
          : 'Keyboard'
      return Response.json(
        { ID: 1, Name: name },
        { headers: { ETag: `W/"${name}"` } },
      )
    })
    const controller = new AbortController()
    const products = createODataServerReadService(
      createEvent(requestFetch),
      'catalog',
    ).entitySet('Products')
    const key = { ID: 1, Locale: 'en' }

    await expect(products.fetchOne<{ ID: number, Name: string }>(
      key,
      { $select: ['ID', 'Name'] },
      { signal: controller.signal },
    )).resolves.toEqual({ ID: 1, Name: 'Keyboard' })
    await expect(products.fetchOneWithResponse<{ ID: number, Name: string }>(
      key,
    )).resolves.toEqual({
      data: { ID: 1, Name: 'Keyboard' },
      etag: 'W/"Keyboard"',
    })
    await expect(products.fetchNavigationOneWithResponse<{ ID: number, Name: string }>({
      source: key,
      navigationPath: 'Supplier',
      query: { $select: ['ID', 'Name'] },
    })).resolves.toEqual({
      data: { ID: 1, Name: 'Acme' },
      etag: 'W/"Acme"',
    })
    await expect(products.fetchNavigationOneWithResponse({
      source: key,
      navigationPath: ['Reviews'],
      targetKey: { ID: 10 },
    })).resolves.toMatchObject({ etag: 'W/"Keyboard"' })
    await expect(products.fetchContainedOneWithResponse({
      kind: 'contained-entity',
      rootKey: key,
      path: [{ navigationPath: ['Attachments'], key: { AttachmentID: 'A/B' } }],
    })).resolves.toEqual({
      data: { ID: 1, Name: 'manual.pdf' },
      etag: 'W/"manual.pdf"',
    })

    expect(requestFetch).toHaveBeenCalledTimes(5)
    expect(requestUrl(requestFetch.mock.calls[0]![0])).toBe(
      '/api/odx/catalog-api/Products(ID=1,Locale=\'en\')?$select=ID,Name',
    )
    expect(requestFetch.mock.calls[0]![1]?.signal).toBe(controller.signal)
    expect(requestUrl(requestFetch.mock.calls[1]![0])).toBe(
      '/api/odx/catalog-api/Products(ID=1,Locale=\'en\')',
    )
    expect(requestUrl(requestFetch.mock.calls[2]![0])).toBe(
      '/api/odx/catalog-api/Products(ID=1,Locale=\'en\')/Supplier?$select=ID,Name',
    )
    expect(requestUrl(requestFetch.mock.calls[3]![0])).toBe(
      '/api/odx/catalog-api/Products(ID=1,Locale=\'en\')/Reviews(ID=10)',
    )
    expect(requestUrl(requestFetch.mock.calls[4]![0])).toBe(
      '/api/odx/catalog-api/Products(ID=1,Locale=\'en\')/Attachments(AttachmentID=\'A%2FB\')',
    )
  })

  it('uses the request-scoped proxy route for lists and server-driven pages', async () => {
    const requestFetch = vi.fn<typeof globalThis.fetch>(async (request) => {
      const url = requestUrl(request)
      if (url.includes('Reviews')) {
        return Response.json({
          value: [{ ID: 10, Text: 'Useful' }],
        })
      }
      return Response.json({
        '@odata.count': 2,
        '@odata.nextLink': 'https://private.example.test/Products?%24skiptoken=next-2',
        'value': [{ ID: 1, Name: 'Keyboard' }],
      })
    })
    const controller = new AbortController()
    const products = createODataServerReadService(
      createEvent(requestFetch),
      'catalog',
    ).entitySet('Products')

    await expect(products.fetchPage<{ ID: number, Name: string }>({
      $count: true,
      $select: 'ID,Name',
      $top: 1,
    }, { signal: controller.signal })).resolves.toEqual({
      continuation: { token: '%24skiptoken=next-2' },
      items: [{ ID: 1, Name: 'Keyboard' }],
      totalCount: 2,
    })
    await expect(products.fetchNavigationList<{ ID: number, Text: string }>(
      { ID: 1, Locale: 'en' },
      ['Reviews'],
      { $select: 'ID,Text' },
    )).resolves.toEqual([{ ID: 10, Text: 'Useful' }])

    expect(requestFetch).toHaveBeenCalledTimes(2)
    const firstUrl = requestUrl(requestFetch.mock.calls[0]![0])
    expect(firstUrl).toContain('/api/odx/catalog-api/Products?')
    expect(decodeURIComponent(firstUrl)).toContain('$count=true')
    expect(decodeURIComponent(firstUrl)).toContain('$select=ID,Name')
    expect(decodeURIComponent(firstUrl)).toContain('$top=1')
    expect(requestFetch.mock.calls[0]![1]?.signal).toBe(controller.signal)
    expect(requestUrl(requestFetch.mock.calls[1]![0])).toContain(
      '/api/odx/catalog-api/Products(ID=1,Locale=\'en\')/Reviews?',
    )
  })

  it('anchors opaque entity-set and navigation continuations to their owning proxy paths', async () => {
    const requestFetch = vi.fn<typeof globalThis.fetch>(async (request) => {
      const url = requestUrl(request)
      if (url.includes('/Reviews?cursor=review-2')) {
        return Response.json({
          d: { results: [{ ID: 11, Text: 'Detailed' }] },
        })
      }
      if (url.includes('/Reviews')) {
        return Response.json({
          d: {
            __count: '2',
            __next: 'https://private.example.test/elsewhere?cursor=review-2',
            results: [{ ID: 10, Text: 'Useful' }],
          },
        })
      }
      if (url.includes('%24skiptoken=product-2')) {
        return Response.json({ value: [{ ID: 2, Name: 'Mouse' }] })
      }
      return Response.json({
        '@odata.count': 2,
        '@odata.nextLink': 'https://private.example.test/elsewhere?%24skiptoken=product-2',
        'value': [{ ID: 1, Name: 'Keyboard' }],
      })
    })
    const products = createODataServerReadService(
      createEvent(requestFetch),
      'catalog',
    ).entitySet('Products')

    const first = await products.fetchPage<{ ID: number, Name: string }>({ $top: 1 })
    await expect(products.fetchNextPage<{ ID: number, Name: string }>(
      first.continuation!,
    )).resolves.toEqual({
      items: [{ ID: 2, Name: 'Mouse' }],
    })
    const firstReviews = await products.fetchNavigationPage<{ ID: number, Text: string }>(
      { ID: 1, Locale: 'en' },
      ['Reviews'],
      { $top: 1 },
    )
    await expect(products.fetchNavigationNextPage<{ ID: number, Text: string }>(
      { ID: 1, Locale: 'en' },
      ['Reviews'],
      firstReviews.continuation!,
    )).resolves.toEqual({
      items: [{ ID: 11, Text: 'Detailed' }],
    })

    expect(requestUrl(requestFetch.mock.calls[1]![0])).toBe(
      '/api/odx/catalog-api/Products?%24skiptoken=product-2',
    )
    expect(requestUrl(requestFetch.mock.calls[3]![0])).toBe(
      '/api/odx/catalog-api/Products(ID=1,Locale=\'en\')/Reviews?cursor=review-2',
    )
  })

  it('invokes typed functions on collection, entity, and navigation bindings', async () => {
    const requestFetch = vi.fn<typeof globalThis.fetch>(async request =>
      Response.json({ path: requestUrl(request) }))
    const products = createODataServerReadService(
      createEvent(requestFetch),
      'catalog',
    ).entitySet('Products')

    await products.invokeFunction('Demo.Defaults', {
      parameters: {
        Locale: { type: 'Edm.String', value: 'en-US' },
      },
    })
    await products.invokeFunction('Demo.Score', {
      key: 1,
      navigationPath: ['Reviews'],
      parameters: {
        Active: { type: 'Edm.Boolean', value: true },
      },
    })

    expect(requestUrl(requestFetch.mock.calls[0]![0])).toBe(
      '/api/odx/catalog-api/Products/Demo.Defaults(Locale=\'en-US\')',
    )
    expect(requestUrl(requestFetch.mock.calls[1]![0])).toBe(
      '/api/odx/catalog-api/Products(1)/Reviews/Demo.Score(Active=true)',
    )
  })

  it('fails closed before transport for invalid services and bindings', async () => {
    const requestFetch = vi.fn<typeof globalThis.fetch>()
    const event = createEvent(requestFetch)

    expect(() => createODataServerReadService(event, 'missing')).toThrow(
      'Unknown OData service "missing".',
    )
    const products = createODataServerReadService(event, 'catalog').entitySet('Products')
    expect(() => products.invokeFunction('../Demo.Defaults')).toThrow('qualified name')
    expect(() => products.invokeFunction('Demo.Score', {
      navigationPath: ['Reviews'],
    })).toThrow('requires an entity key')
    expect(() => products.fetchNextPage({ token: '#unsafe' })).toThrow(
      'valid OData continuation token',
    )
    expect(() => products.fetchNavigationNextPage(
      1,
      ['Reviews'],
      { token: '' },
    )).toThrow('valid OData continuation token')
    expect(() => products.fetchNavigationOneWithResponse({
      source: 1,
      navigationPath: ['Reviews', '../Secret'],
    })).toThrow('valid identifier segments')
    expect(() => products.fetchContainedOneWithResponse({
      kind: 'contained-entity',
      rootKey: 1,
      path: [{ navigationPath: ['../Attachments'], key: 2 }],
    })).toThrow('valid identifier segments')
    expect(requestFetch).not.toHaveBeenCalled()
  })

  it('requires the Nuxt ODX middleware context', () => {
    expect(() => createODataServerReadService({ context: {} } as H3Event, 'catalog'))
      .toThrow('ODX server reads require the Nuxt ODX server middleware.')
  })
})
