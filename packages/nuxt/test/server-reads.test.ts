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
    expect(requestFetch).not.toHaveBeenCalled()
  })

  it('requires the Nuxt ODX middleware context', () => {
    expect(() => createODataServerReadService({ context: {} } as H3Event, 'catalog'))
      .toThrow('ODX server reads require the Nuxt ODX server middleware.')
  })
})
