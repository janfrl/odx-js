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

    expect(products).toMatchObject({
      supportsCollectionPages: true,
      supportsContinuations: true,
      supportsContainedEntityResponses: true,
      supportsEntityResponses: true,
      supportsNavigationEntityResponses: true,
    })

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

  it('batches structured V4 and SAP Gateway V2 reads with ordered partial results', async () => {
    const responseBody = [
      '--batch_response',
      'Content-Type: application/http',
      '',
      'HTTP/1.1 200 OK',
      'Content-Type: application/json',
      '',
      '{"value":[{"ID":1,"Name":"Keyboard"}]}',
      '--batch_response',
      'Content-Type: application/http',
      '',
      'HTTP/1.1 404 Not Found',
      'Content-Type: application/json',
      '',
      '{"error":{"code":"NOT_FOUND"}}',
      '--batch_response--',
      '',
    ].join('\r\n')
    const requestFetch = vi.fn<typeof globalThis.fetch>(async () => new Response(
      responseBody,
      { headers: { 'Content-Type': 'multipart/mixed; boundary=batch_response' } },
    ))
    const signal = new AbortController().signal
    const catalog = createODataServerReadService(createEvent(requestFetch), 'catalog')
    const reads = [{
      kind: 'collection' as const,
      entitySet: 'Products',
      query: { $select: ['ID', 'Name'], $top: 1 },
    }, {
      kind: 'navigation-entity' as const,
      entitySet: 'Products',
      source: { ID: 1, Locale: 'en' },
      navigationPath: ['Reviews'],
      targetKey: 99,
      headers: { 'If-None-Match': 'W/"review-99"' },
    }]

    expect(catalog).toMatchObject({
      supportsBatchReads: true,
      supportsV2BatchReads: true,
    })
    await expect(catalog.batchReads(reads, { signal })).resolves.toEqual([{
      succeeded: true,
      status: 200,
      headers: { 'content-type': 'application/json' },
      body: { value: [{ ID: 1, Name: 'Keyboard' }] },
    }, {
      succeeded: false,
      status: 404,
      headers: { 'content-type': 'application/json' },
      body: { error: { code: 'NOT_FOUND' } },
    }])

    const firstOptions = requestFetch.mock.calls[0]![1]!
    expect(requestUrl(requestFetch.mock.calls[0]![0])).toBe(
      '/api/odx/catalog-api/$batch',
    )
    expect(firstOptions.signal).toBe(signal)
    expect(new Headers(firstOptions.headers).get('odata-version')).toBe('4.0')
    expect(String(firstOptions.body)).toContain(
      'GET Products?%24select=ID%2CName&%24top=1 HTTP/1.1',
    )
    expect(String(firstOptions.body)).toContain(
      'GET Products(ID=1,Locale=\'en\')/Reviews(99) HTTP/1.1',
    )
    expect(String(firstOptions.body)).toContain('If-None-Match: W/"review-99"')

    await catalog.v2BatchReads(reads)
    const secondOptions = requestFetch.mock.calls[1]![1]!
    expect(new Headers(secondOptions.headers).get('dataserviceversion')).toBe('2.0')
    expect(new Headers(secondOptions.headers).get('maxdataserviceversion')).toBe('2.0')
    expect(new Headers(secondOptions.headers).has('odata-version')).toBe(false)
  })

  it.each(['batchReads', 'v2BatchReads'] as const)('%s preserves boundary text and rejects malformed envelopes', async (method) => {
    const entity = { ID: 1, Name: 'Keep --batch_response in the product name' }
    const operation = [
      '--batch_response',
      'Content-Type: application/http',
      '',
      'HTTP/1.1 200 OK',
      'Content-Type: application/json',
      '',
      JSON.stringify({ value: [entity] }),
    ].join('\r\n')
    let responseBody = `${operation}\r\n--batch_response--`
    const requestFetch = vi.fn<typeof globalThis.fetch>(async () => new Response(
      responseBody,
      { headers: { 'Content-Type': 'multipart/mixed; boundary=batch_response' } },
    ))
    const catalog = createODataServerReadService(createEvent(requestFetch), 'catalog')
    const reads = [{ kind: 'collection' as const, entitySet: 'Products' }]
    await expect(catalog[method](reads)).resolves.toMatchObject([{
      succeeded: true,
      body: { value: [entity] },
    }])

    responseBody = operation
    await expect(catalog[method](reads)).rejects.toMatchObject({
      code: 'core.changeset.incomplete-response',
    })
    responseBody = [operation, '--batch_response', 'Content-Type: text/plain', '', 'Unknown result', '--batch_response--'].join('\r\n')
    await expect(catalog[method](reads)).rejects.toMatchObject({
      code: 'core.changeset.invalid-response-part',
    })
    expect(requestFetch).toHaveBeenCalledTimes(3)
  })

  it('rejects unsafe or mismatched request-scoped read batches', async () => {
    const responseBody = [
      '--batch_response',
      'Content-Type: application/http',
      '',
      'HTTP/1.1 200 OK',
      '',
      '{}',
      '--batch_response--',
      '',
    ].join('\r\n')
    const requestFetch = vi.fn<typeof globalThis.fetch>(async () => new Response(
      responseBody,
      { headers: { 'Content-Type': 'multipart/mixed; boundary=batch_response' } },
    ))
    const catalog = createODataServerReadService(createEvent(requestFetch), 'catalog')

    await expect(catalog.batchReads([{
      kind: 'collection',
      entitySet: 'Products',
    }, {
      kind: 'entity',
      entitySet: 'Products',
      key: 1,
    }])).rejects.toThrow('count does not match')
    await expect(catalog.batchReads([{
      kind: 'navigation-collection',
      entitySet: 'Products',
      source: 1,
      navigationPath: ['../Secret'],
    }])).rejects.toThrow('valid identifier segments')
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

  it('invokes unbound typed functions at the request-scoped service root', async () => {
    const requestFetch = vi.fn<typeof globalThis.fetch>(async request =>
      Response.json({ path: requestUrl(request) }))
    const signal = new AbortController().signal
    const catalog = createODataServerReadService(
      createEvent(requestFetch),
      'catalog',
    )

    await catalog.invokeFunction('Demo.ServiceDefaults', {
      parameters: {
        Locale: { type: 'Edm.String', value: 'en-US' },
      },
    }, { signal })

    expect(requestFetch).toHaveBeenCalledOnce()
    expect(requestUrl(requestFetch.mock.calls[0]![0])).toBe(
      '/api/odx/catalog-api/Demo.ServiceDefaults(Locale=\'en-US\')',
    )
    expect(requestFetch.mock.calls[0]![1]?.signal).toBe(signal)
  })

  it('fails closed before transport for invalid services and bindings', async () => {
    const requestFetch = vi.fn<typeof globalThis.fetch>()
    const event = createEvent(requestFetch)

    expect(() => createODataServerReadService(event, 'missing')).toThrow(
      'Unknown OData service "missing".',
    )
    const products = createODataServerReadService(event, 'catalog').entitySet('Products')
    const catalog = createODataServerReadService(event, 'catalog')
    expect(() => catalog.invokeFunction('../Demo.Defaults')).toThrow('qualified name')
    expect(() => catalog.invokeFunction('Demo.Defaults', { key: 1 })).toThrow(
      'cannot declare an entity or navigation binding',
    )
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
