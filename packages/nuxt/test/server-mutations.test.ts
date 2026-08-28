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

function emptyChangeSetResponse(memberCount: number): string {
  const members = Array.from({ length: memberCount }).fill([
    '--changeset_response',
    'Content-Type: application/http',
    'Content-Transfer-Encoding: binary',
    '',
    'HTTP/1.1 204 No Content',
    '',
    '',
  ]).flat() as string[]
  return [
    '--batch_response',
    'Content-Type: multipart/mixed; boundary=changeset_response',
    '',
    ...members,
    '--changeset_response--',
    '--batch_response--',
    '',
  ].join('\r\n')
}

describe('nitro server mutation service', () => {
  it('preserves create, update, and delete response metadata on structured keys', async () => {
    const requestFetch = vi.fn<typeof globalThis.fetch>(async (request, init) => {
      const url = requestUrl(request)
      if (init?.method === 'POST' && url.endsWith('/Products')) {
        return Response.json({ ID: 2, Locale: 'en', Name: 'Created' }, {
          headers: {
            'ETag': 'W/"product-2"',
            'Location': '/odata/Products(ID=2,Locale=\'en\')',
            'OData-EntityId': 'Products(ID=2,Locale=\'en\')',
          },
        })
      }
      if (init?.method === 'PATCH' && url.endsWith('/Products(ID=1,Locale=\'en\')')) {
        return new Response(null, {
          status: 204,
          headers: { ETag: 'W/"product-2"' },
        })
      }
      if (init?.method === 'PATCH' && url.endsWith('/Products(2)'))
        return Response.json({ ID: 2, Name: 'Updated' })
      if (init?.method === 'DELETE' && url.endsWith('/Products(ID=1,Locale=\'en\')')) {
        return Response.json({ ID: 1, deleted: true }, {
          headers: {
            'ETag': 'W/"product-3"',
            'SAP-Message': '{"code":"DELETED","message":"Product deleted","severity":"success"}',
          },
        })
      }
      return new Response(null, { status: 404 })
    })
    const products = createODataServerMutationService(
      createEvent(requestFetch),
      'catalog',
    ).entitySet('Products')
    const key = { ID: 1, Locale: 'en' }

    await expect(products.createWithResponse({ Name: 'Created' })).resolves.toEqual({
      data: { ID: 2, Locale: 'en', Name: 'Created' },
      entityId: 'Products(ID=2,Locale=\'en\')',
      etag: 'W/"product-2"',
      location: '/odata/Products(ID=2,Locale=\'en\')',
    })
    await expect(products.updateWithResponse(key, { Name: 'Updated' }, {
      headers: { 'If-Match': 'W/"product-1"' },
    })).resolves.toEqual({ etag: 'W/"product-2"' })
    await expect(products.update<{ ID: number, Name: string }>(2, { Name: 'Updated' }))
      .resolves
      .toEqual({ ID: 2, Name: 'Updated' })
    await expect(products.removeWithResponse(key, {
      headers: { 'If-Match': 'W/"product-2"' },
    })).resolves.toEqual({
      data: { ID: 1, deleted: true },
      etag: 'W/"product-3"',
      sapMessage: '{"code":"DELETED","message":"Product deleted","severity":"success"}',
    })

    expect(requestFetch).toHaveBeenCalledTimes(4)
    const requests = requestFetch.mock.calls.map(([request, init]) => ({
      body: init?.body,
      headers: new Headers(init?.headers),
      method: init?.method,
      url: requestUrl(request),
    }))
    expect(requests[1]).toMatchObject({
      body: JSON.stringify({ Name: 'Updated' }),
      method: 'PATCH',
      url: '/api/odx/catalog-api/Products(ID=1,Locale=\'en\')',
    })
    expect(requests[1]!.headers.get('if-match')).toBe('W/"product-1"')
    expect(requests[3]).toMatchObject({
      method: 'DELETE',
      url: '/api/odx/catalog-api/Products(ID=1,Locale=\'en\')',
    })
    expect(requests[3]!.headers.get('if-match')).toBe('W/"product-2"')
  })

  it('uses explicit SAP Gateway MERGE for root and navigation updates', async () => {
    const requestFetch = vi.fn<typeof globalThis.fetch>(async (_request, init) =>
      new Response(null, {
        status: 204,
        headers: { ETag: init?.method === 'MERGE' ? 'W/"merged"' : 'W/"wrong"' },
      }))
    const products = createODataServerMutationService(
      createEvent(requestFetch),
      'catalog',
    ).entitySet('Products')

    expect(products.supportsMerge).toBe(true)
    expect(products.supportsNavigationMerge).toBe(true)
    await products.merge(1, { Name: 'Root' })
    await expect(products.mergeWithResponse(2, { Name: 'Root response' }, {
      headers: { 'If-Match': 'W/"root-2"' },
    })).resolves.toEqual({ etag: 'W/"merged"' })
    await products.mergeNavigation(1, ['Supplier'], {
      body: { Name: 'Supplier' },
    })
    await expect(products.mergeNavigationWithResponse(1, ['Reviews'], {
      targetKey: 3,
      body: { Text: 'Reviewed' },
    }, {
      headers: { 'If-Match': 'W/"review-3"' },
    })).resolves.toEqual({ etag: 'W/"merged"' })

    expect(requestFetch).toHaveBeenCalledTimes(4)
    const requests = requestFetch.mock.calls.map(([request, init]) => ({
      body: init?.body,
      headers: new Headers(init?.headers),
      method: init?.method,
      url: requestUrl(request),
    }))
    expect(requests.map(request => request.method)).toEqual([
      'MERGE',
      'MERGE',
      'MERGE',
      'MERGE',
    ])
    expect(requests.map(request => request.url)).toEqual([
      '/api/odx/catalog-api/Products(1)',
      '/api/odx/catalog-api/Products(2)',
      '/api/odx/catalog-api/Products(1)/Supplier',
      '/api/odx/catalog-api/Products(1)/Reviews(3)',
    ])
    expect(requests[1]?.headers.get('if-match')).toBe('W/"root-2"')
    expect(requests[3]?.headers.get('if-match')).toBe('W/"review-3"')
  })

  it('uses the request-scoped proxy route for entity, action, and relationship writes', async () => {
    const requestFetch = vi.fn<typeof globalThis.fetch>(async (request) => {
      const url = requestUrl(request)
      if (url.endsWith('/Products')) {
        return Response.json({ ID: 1, Name: 'Created' })
      }
      if (url.endsWith('/Demo.SetCategory')) {
        return Response.json({ Category: 'LIGHT' }, {
          headers: {
            'ETag': 'W/"product-2"',
            'Location': '/odata/Products(1)',
            'SAP-Message': '{"code":"CATEGORY_SET","message":"Category set","severity":"success"}',
          },
        })
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
    await expect(products.invokeWithResponse<{ Category: string }>('Demo.SetCategory', {
      key: 1,
      parameters: { Category: 'LIGHT' },
    }, {
      headers: { 'If-Match': 'W/"product-1"' },
    })).resolves.toEqual({
      data: { Category: 'LIGHT' },
      etag: 'W/"product-2"',
      location: '/odata/Products(1)',
      sapMessage: '{"code":"CATEGORY_SET","message":"Category set","severity":"success"}',
    })
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

  it('invokes actions across service and navigation bindings', async () => {
    const requestFetch = vi.fn<typeof globalThis.fetch>(async (request) => {
      const url = requestUrl(request)
      if (url.endsWith('/Demo.Recalculate')) {
        return Response.json({ recalculated: true }, {
          headers: {
            'ETag': 'W/"service-2"',
            'SAP-Message': '{"message":"Recalculated","severity":"success"}',
          },
        })
      }
      return Response.json({ path: url })
    })
    const signal = new AbortController().signal
    const service = createODataServerMutationService(
      createEvent(requestFetch),
      'catalog',
    )
    const products = service.entitySet('Products')

    await expect(service.invoke<{ accepted: boolean }>('Demo.Schedule', {
      parameters: { Mode: 'FULL' },
    }, { signal })).resolves.toEqual({ path: '/api/odx/catalog-api/Demo.Schedule' })
    await expect(service.invokeWithResponse<{ recalculated: boolean }>(
      'Demo.Recalculate',
    )).resolves.toEqual({
      data: { recalculated: true },
      etag: 'W/"service-2"',
      sapMessage: '{"message":"Recalculated","severity":"success"}',
    })
    await products.invoke('Demo.Rate', {
      key: 1,
      navigationPath: ['Reviews'],
      parameters: { Rating: 5 },
    })
    await products.invokeWithResponse('Demo.Publish', {
      key: { ID: 1, Locale: 'en' },
      navigationPath: ['Reviews'],
    })

    expect(requestFetch).toHaveBeenCalledTimes(4)
    const requests = requestFetch.mock.calls.map(([request, init]) => ({
      body: init?.body,
      method: init?.method,
      signal: init?.signal,
      url: requestUrl(request),
    }))
    expect(requests).toEqual([{
      body: JSON.stringify({ Mode: 'FULL' }),
      method: 'POST',
      signal,
      url: '/api/odx/catalog-api/Demo.Schedule',
    }, {
      body: JSON.stringify({}),
      method: 'POST',
      signal: undefined,
      url: '/api/odx/catalog-api/Demo.Recalculate',
    }, {
      body: JSON.stringify({ Rating: 5 }),
      method: 'POST',
      signal: undefined,
      url: '/api/odx/catalog-api/Products(1)/Reviews/Demo.Rate',
    }, {
      body: JSON.stringify({}),
      method: 'POST',
      signal: undefined,
      url: '/api/odx/catalog-api/Products(ID=1,Locale=\'en\')/Reviews/Demo.Publish',
    }])
  })

  it('rejects invalid service and navigation action bindings before transport', () => {
    const requestFetch = vi.fn<typeof globalThis.fetch>()
    const service = createODataServerMutationService(
      createEvent(requestFetch),
      'catalog',
    )
    const products = service.entitySet('Products')

    expect(() => service.invoke('../Demo.Schedule')).toThrow('qualified name')
    expect(() => service.invoke('Demo.Schedule', { key: 1 })).toThrow(
      'cannot declare an entity or navigation binding',
    )
    expect(() => products.invoke('Demo.Rate', {
      navigationPath: ['Reviews'],
    })).toThrow('requires an entity key')
    expect(() => products.invokeWithResponse('Demo.Publish', {
      key: 1,
      navigationPath: ['../Reviews'],
    })).toThrow('valid identifier segments')
    expect(requestFetch).not.toHaveBeenCalled()
  })

  it('preserves response metadata from request-scoped relationship writes', async () => {
    const requestFetch = vi.fn<typeof globalThis.fetch>(async (request, init) => {
      const url = requestUrl(request)
      if (init?.method === 'POST' && url.endsWith('/Categories/$ref')) {
        return new Response(null, {
          status: 204,
          headers: { ETag: 'W/"product-2"' },
        })
      }
      if (init?.method === 'DELETE' && url.endsWith('/Categories(ID=7,Locale=\'en\')/$ref')) {
        return Response.json({ ID: 7, unlinked: true }, {
          headers: {
            'ETag': 'W/"product-3"',
            'SAP-Message': '{"code":"UNLINKED","message":"Category unlinked","severity":"success"}',
          },
        })
      }
      return new Response(null, { status: 404 })
    })
    const products = createODataServerMutationService(
      createEvent(requestFetch),
      'catalog',
    ).entitySet('Products')
    const source = { ID: 1, Locale: 'en' }
    const target = { ID: 7, Locale: 'en' }

    await expect(products.linkNavigationWithResponse(
      source,
      ['Categories'],
      'Categories',
      target,
      { headers: { 'If-Match': 'W/"product-1"' } },
    )).resolves.toEqual({ etag: 'W/"product-2"' })
    await expect(products.unlinkNavigationWithResponse<Readonly<{ ID: number, unlinked: boolean }>>(
      source,
      ['Categories'],
      target,
      { headers: { 'If-Match': 'W/"product-2"' } },
    )).resolves.toEqual({
      data: { ID: 7, unlinked: true },
      etag: 'W/"product-3"',
      sapMessage: '{"code":"UNLINKED","message":"Category unlinked","severity":"success"}',
    })

    expect(requestFetch).toHaveBeenCalledTimes(2)
    const requests = requestFetch.mock.calls.map(([request, init]) => ({
      body: init?.body,
      headers: new Headers(init?.headers),
      method: init?.method,
      url: requestUrl(request),
    }))
    expect(requests[0]).toMatchObject({
      body: JSON.stringify({ '@odata.id': 'Categories(ID=7,Locale=\'en\')' }),
      method: 'POST',
      url: '/api/odx/catalog-api/Products(ID=1,Locale=\'en\')/Categories/$ref',
    })
    expect(requests[0]!.headers.get('if-match')).toBe('W/"product-1"')
    expect(requests[1]).toMatchObject({
      method: 'DELETE',
      url: '/api/odx/catalog-api/Products(ID=1,Locale=\'en\')/Categories(ID=7,Locale=\'en\')/$ref',
    })
    expect(requests[1]!.headers.get('if-match')).toBe('W/"product-2"')
  })

  it('owns request-scoped SAP Gateway V2 relationship writes', async () => {
    const requestFetch = vi.fn<typeof globalThis.fetch>(async (request, init) => {
      const url = requestUrl(request)
      if (init?.method === 'POST' && url.endsWith('/$links/Categories')) {
        return new Response(null, {
          status: 204,
          headers: { ETag: 'W/"product-2"' },
        })
      }
      if (init?.method === 'DELETE' && url.endsWith('/$links/Categories(ID=7,Locale=\'en\')')) {
        return Response.json({ ID: 7, unlinked: true }, {
          headers: {
            'ETag': 'W/"product-3"',
            'SAP-Message': '{"code":"UNLINKED","message":"Category unlinked","severity":"success"}',
          },
        })
      }
      return new Response(null, { status: 404 })
    })
    const products = createODataServerMutationService(
      createEvent(requestFetch),
      'catalog',
    ).entitySet('Products')
    const source = { ID: 1, Locale: 'en' }
    const target = { ID: 7, Locale: 'en' }

    expect(products.supportsV2NavigationReferences).toBe(true)
    await expect(products.linkNavigationV2WithResponse(
      source,
      ['Categories'],
      'Categories',
      target,
      { headers: { 'If-Match': 'W/"product-1"' } },
    )).resolves.toEqual({ etag: 'W/"product-2"' })
    await expect(products.unlinkNavigationV2WithResponse<Readonly<{ ID: number, unlinked: boolean }>>(
      source,
      ['Categories'],
      target,
      { headers: { 'If-Match': 'W/"product-2"' } },
    )).resolves.toEqual({
      data: { ID: 7, unlinked: true },
      etag: 'W/"product-3"',
      sapMessage: '{"code":"UNLINKED","message":"Category unlinked","severity":"success"}',
    })

    expect(requestFetch).toHaveBeenCalledTimes(2)
    const requests = requestFetch.mock.calls.map(([request, init]) => ({
      body: init?.body,
      headers: new Headers(init?.headers),
      method: init?.method,
      url: requestUrl(request),
    }))
    expect(requests[0]).toMatchObject({
      body: JSON.stringify({ uri: 'Categories(ID=7,Locale=\'en\')' }),
      method: 'POST',
      url: '/api/odx/catalog-api/Products(ID=1,Locale=\'en\')/$links/Categories',
    })
    expect(requests[0]!.headers.get('if-match')).toBe('W/"product-1"')
    expect(requests[1]).toMatchObject({
      method: 'DELETE',
      url: '/api/odx/catalog-api/Products(ID=1,Locale=\'en\')/$links/Categories(ID=7,Locale=\'en\')',
    })
    expect(requests[1]!.headers.get('if-match')).toBe('W/"product-2"')
  })

  it('executes request-scoped navigation CRUD through structured paths', async () => {
    const requestFetch = vi.fn<typeof globalThis.fetch>(async (request, init) => {
      const headers = new Headers(init?.headers)
      const mode = headers.get('x-contract-mode')
      if (mode === 'create-body')
        return Response.json({ ID: 10, Text: 'Created body' })
      if (mode === 'create-response') {
        return Response.json({ ID: 11, Text: 'Created response' }, {
          status: 201,
          headers: {
            'ETag': 'W/"review-11"',
            'Location': '/odata/Reviews(11)',
            'OData-EntityId': 'Reviews(11)',
          },
        })
      }
      if (mode === 'update-body')
        return Response.json({ ID: 12, Text: 'Updated body' })
      if (mode === 'update-response') {
        return Response.json({ ID: 13, Text: 'Updated response' }, {
          headers: {
            'ETag': 'W/"review-13-next"',
            'SAP-Message': '{"message":"Review updated","severity":"success"}',
          },
        })
      }
      if (mode === 'remove-body')
        return Response.json({ ID: 14, removed: true })
      return Response.json({ ID: 15, removed: true }, {
        headers: {
          'ETag': 'W/"review-15-deleted"',
          'SAP-Message': '{"message":"Review removed","severity":"success"}',
        },
      })
    })
    const reviews = createODataServerMutationService(
      createEvent(requestFetch),
      'catalog',
    ).entitySet('Products')
    const source = { ID: 1, Locale: 'en' }

    await expect(reviews.createNavigation<Readonly<{ ID: number, Text: string }>>(
      source,
      ['Reviews'],
      { Text: 'Created body' },
      { headers: { 'X-Contract-Mode': 'create-body' } },
    )).resolves.toEqual({ ID: 10, Text: 'Created body' })
    await expect(reviews.createNavigationWithResponse<Readonly<{ ID: number, Text: string }>>(
      source,
      ['Reviews'],
      { Text: 'Created response' },
      { headers: { 'X-Contract-Mode': 'create-response' } },
    )).resolves.toEqual({
      data: { ID: 11, Text: 'Created response' },
      entityId: 'Reviews(11)',
      etag: 'W/"review-11"',
      location: '/odata/Reviews(11)',
    })
    await expect(reviews.updateNavigation<Readonly<{ ID: number, Text: string }>>(
      source,
      ['PrimaryReview'],
      { body: { Text: 'Updated body' } },
      { headers: { 'X-Contract-Mode': 'update-body' } },
    )).resolves.toEqual({ ID: 12, Text: 'Updated body' })
    await expect(reviews.updateNavigationWithResponse<Readonly<{ ID: number, Text: string }>>(
      source,
      ['Reviews'],
      { body: { Text: 'Updated response' }, targetKey: 13 },
      {
        headers: {
          'If-Match': 'W/"review-13"',
          'X-Contract-Mode': 'update-response',
        },
      },
    )).resolves.toEqual({
      data: { ID: 13, Text: 'Updated response' },
      etag: 'W/"review-13-next"',
      sapMessage: '{"message":"Review updated","severity":"success"}',
    })
    await expect(reviews.removeNavigation<Readonly<{ ID: number, removed: boolean }>>(
      source,
      ['Reviews'],
      14,
      { headers: { 'X-Contract-Mode': 'remove-body' } },
    )).resolves.toEqual({ ID: 14, removed: true })
    await expect(reviews.removeNavigationWithResponse<Readonly<{ ID: number, removed: boolean }>>(
      source,
      ['Reviews'],
      15,
      {
        headers: {
          'If-Match': 'W/"review-15"',
          'X-Contract-Mode': 'remove-response',
        },
      },
    )).resolves.toEqual({
      data: { ID: 15, removed: true },
      etag: 'W/"review-15-deleted"',
      sapMessage: '{"message":"Review removed","severity":"success"}',
    })

    expect(requestFetch).toHaveBeenCalledTimes(6)
    const requests = requestFetch.mock.calls.map(([request, init]) => ({
      body: init?.body,
      headers: new Headers(init?.headers),
      method: init?.method,
      url: requestUrl(request),
    }))
    expect(requests.map(request => ({ method: request.method, url: request.url }))).toEqual([
      { method: 'POST', url: '/api/odx/catalog-api/Products(ID=1,Locale=\'en\')/Reviews' },
      { method: 'POST', url: '/api/odx/catalog-api/Products(ID=1,Locale=\'en\')/Reviews' },
      { method: 'PATCH', url: '/api/odx/catalog-api/Products(ID=1,Locale=\'en\')/PrimaryReview' },
      { method: 'PATCH', url: '/api/odx/catalog-api/Products(ID=1,Locale=\'en\')/Reviews(13)' },
      { method: 'DELETE', url: '/api/odx/catalog-api/Products(ID=1,Locale=\'en\')/Reviews(14)' },
      { method: 'DELETE', url: '/api/odx/catalog-api/Products(ID=1,Locale=\'en\')/Reviews(15)' },
    ])
    expect(requests[0]!.body).toBe(JSON.stringify({ Text: 'Created body' }))
    expect(requests[1]!.body).toBe(JSON.stringify({ Text: 'Created response' }))
    expect(requests[2]!.body).toBe(JSON.stringify({ Text: 'Updated body' }))
    expect(requests[3]!.body).toBe(JSON.stringify({ Text: 'Updated response' }))
    expect(requests[3]!.headers.get('if-match')).toBe('W/"review-13"')
    expect(requests[5]!.headers.get('if-match')).toBe('W/"review-15"')
  })

  it('creates, reads, and replaces media through request-scoped structured paths', async () => {
    const initial = Uint8Array.from([37, 80, 68, 70])
    const replacement = Uint8Array.from([1, 2, 3])
    const created = Uint8Array.from([4, 5, 6])
    const requestFetch = vi.fn<typeof globalThis.fetch>(async (request, init) => {
      const url = requestUrl(request)
      if (init?.method === 'POST') {
        const contained = url.endsWith('/Products(ID=1,IsActiveEntity=false)/Attachments')
        return Response.json({ ID: contained ? 8 : 7, FileName: contained ? 'note.txt' : 'manual.pdf' }, {
          status: 201,
          headers: {
            'ETag': contained ? 'W/"media-8"' : 'W/"media-7"',
            'Location': contained ? '/odata/Attachments(8)' : '/odata/Products(7)',
            'OData-EntityId': contained ? 'Attachments(8)' : 'Products(7)',
            'SAP-Message': '{"message":"Document created","severity":"success"}',
          },
        })
      }
      if (init?.method === 'GET') {
        return new Response(initial, {
          headers: {
            'Content-Disposition': 'attachment; filename="manual.pdf"',
            'Content-Type': 'application/pdf',
            'ETag': 'W/"media-1"',
          },
        })
      }
      return new Response(null, {
        status: 204,
        headers: {
          'ETag': 'W/"media-2"',
          'SAP-Message': '{"message":"Document replaced","severity":"success"}',
        },
      })
    })
    const products = createODataServerMutationService(
      createEvent(requestFetch),
      'catalog',
    ).entitySet('Products')
    const attachment = {
      kind: 'contained-entity' as const,
      rootKey: { ID: 1, IsActiveEntity: false },
      path: [{ navigationPath: ['Attachments'], key: { AttachmentID: 'A/B' } }],
    }

    await expect(products.createMedia<Readonly<{ ID: number, FileName: string }>>(
      created,
      {
        contentType: 'application/pdf',
        slug: 'manual.pdf',
      },
    )).resolves.toEqual({
      data: { ID: 7, FileName: 'manual.pdf' },
      entityId: 'Products(7)',
      etag: 'W/"media-7"',
      location: '/odata/Products(7)',
      sapMessage: '{"message":"Document created","severity":"success"}',
    })
    await expect(products.createNavigationMedia<Readonly<{ ID: number, FileName: string }>>(
      { ID: 1, IsActiveEntity: false },
      ['Attachments'],
      created,
      {
        contentType: 'text/plain',
        slug: 'note.txt',
      },
    )).resolves.toMatchObject({
      data: { ID: 8, FileName: 'note.txt' },
      entityId: 'Attachments(8)',
      etag: 'W/"media-8"',
    })

    const read = await products.fetchMedia(attachment, {
      headers: { 'X-Correlation-ID': 'media-read-1' },
      streamProperty: 'Content',
    })
    expect(Array.from(new Uint8Array(read.data))).toEqual(Array.from(initial))
    expect(read).toMatchObject({
      contentDisposition: 'attachment; filename="manual.pdf"',
      contentType: 'application/pdf',
      etag: 'W/"media-1"',
    })
    await expect(products.updateMedia(attachment, replacement, {
      contentType: 'application/pdf',
      headers: { 'If-Match': 'W/"media-1"' },
      streamProperty: 'Content',
    })).resolves.toEqual({
      etag: 'W/"media-2"',
      sapMessage: '{"message":"Document replaced","severity":"success"}',
    })

    expect(requestFetch).toHaveBeenCalledTimes(4)
    const requests = requestFetch.mock.calls.map(([request, init]) => ({
      body: init?.body,
      headers: new Headers(init?.headers),
      method: init?.method,
      url: requestUrl(request),
    }))
    expect(requests[0]).toMatchObject({
      method: 'POST',
      url: '/api/odx/catalog-api/Products',
    })
    expect(requests[0]!.headers.get('content-type')).toBe('application/pdf')
    expect(requests[0]!.headers.get('prefer')).toBe('return=representation')
    expect(requests[0]!.headers.get('slug')).toBe('manual.pdf')
    expect(Array.from(requests[0]!.body as Uint8Array)).toEqual(Array.from(created))
    expect(requests[1]).toMatchObject({
      method: 'POST',
      url: '/api/odx/catalog-api/Products(ID=1,IsActiveEntity=false)/Attachments',
    })
    expect(requests[1]!.headers.get('content-type')).toBe('text/plain')
    expect(requests[1]!.headers.get('slug')).toBe('note.txt')
    const url = '/api/odx/catalog-api/Products(ID=1,IsActiveEntity=false)/Attachments(AttachmentID=\'A%2FB\')/Content/$value'
    expect(requests[2]).toMatchObject({ method: 'GET', url })
    expect(requests[2]!.headers.get('accept')).toBe('application/octet-stream')
    expect(requests[2]!.headers.get('x-correlation-id')).toBe('media-read-1')
    expect(requests[3]).toMatchObject({ method: 'PUT', url })
    expect(requests[3]!.headers.get('content-type')).toBe('application/pdf')
    expect(requests[3]!.headers.get('if-match')).toBe('W/"media-1"')
    expect(Array.from(requests[3]!.body as Uint8Array)).toEqual(Array.from(replacement))
  })

  it('invokes OData V2 FunctionImports at the request-scoped service root', async () => {
    const requestFetch = vi.fn<typeof globalThis.fetch>(async (request, init) =>
      Response.json({
        method: init?.method,
        url: requestUrl(request),
      }))
    const signal = new AbortController().signal
    const service = createODataServerMutationService(
      createEvent(requestFetch),
      'catalog',
    )

    expect(service.supportsV2FunctionImports).toBe(true)
    await expect(service.invokeFunctionImport<Readonly<{ method: string, url: string }>>(
      'ApproveProduct',
      {
        method: 'POST',
        parameters: {
          ID: { type: 'Edm.Int32', value: 1 },
          Reason: { type: 'Edm.String', value: 'A/B\'s desk' },
          Optional: { type: 'Edm.String', value: null },
        },
      },
      { signal },
    )).resolves.toMatchObject({ method: 'POST' })

    expect(requestFetch).toHaveBeenCalledOnce()
    const [request, init] = requestFetch.mock.calls[0]!
    const url = requestUrl(request)
    expect(url).toContain('/api/odx/catalog-api/ApproveProduct?')
    expect(decodeURIComponent(url)).toContain('ID=1')
    expect(new URL(url, 'http://localhost').searchParams.get('Reason'))
      .toBe('\'A/B\'\'s desk\'')
    expect(decodeURIComponent(url)).not.toContain('Optional')
    expect(init?.method).toBe('POST')
    expect(init?.body).toBeUndefined()
    expect(init?.signal).toBe(signal)
  })

  it('rejects unsafe V2 FunctionImports before request-scoped transport', () => {
    const requestFetch = vi.fn<typeof globalThis.fetch>()
    const service = createODataServerMutationService(
      createEvent(requestFetch),
      'catalog',
    )

    expect(() => service.invokeFunctionImport('../ApproveProduct', { method: 'POST' }))
      .toThrow('valid identifier')
    expect(() => service.invokeFunctionImport('ApproveProduct', {
      method: 'DELETE',
    } as any)).toThrow('explicit GET or POST')
    expect(() => service.invokeFunctionImport('ApproveProduct', {
      method: 'POST',
      parameters: {
        Value: { type: 'Edm.Duration', value: 'PT1H' } as any,
      },
    })).toThrow('Unsupported OData V2 FunctionImport parameter type')
    expect(requestFetch).not.toHaveBeenCalled()
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

  it('owns atomic root create and delete members for V4 and SAP Gateway V2', async () => {
    const requestFetch = vi.fn<typeof globalThis.fetch>(async () => new Response(
      emptyChangeSetResponse(2),
      { headers: { 'Content-Type': 'multipart/mixed; boundary=batch_response' } },
    ))
    const service = createODataServerMutationService(createEvent(requestFetch), 'catalog')
    const mutations = [{
      kind: 'create' as const,
      entitySet: 'Products',
      body: { ID: 2, Name: 'Created root' },
    }, {
      kind: 'delete' as const,
      entitySet: 'Products',
      key: { ID: 1, Locale: 'en' },
      headers: { 'If-Match': 'W/"product-1"' },
    }]

    await expect(service.changeSet(mutations)).resolves.toHaveLength(2)
    expect(service.supportsV2AtomicRootMutations).toBe(true)
    await expect(service.v2ChangeSet(mutations)).resolves.toHaveLength(2)

    expect(requestFetch).toHaveBeenCalledTimes(2)
    const v4 = requestFetch.mock.calls[0]?.[1]
    const v2 = requestFetch.mock.calls[1]?.[1]
    for (const request of [v4, v2]) {
      expect(request?.body).toContain('POST Products HTTP/1.1')
      expect(request?.body).toContain('{"ID":2,"Name":"Created root"}')
      expect(request?.body).toContain(
        'DELETE Products(ID=1,Locale=\'en\') HTTP/1.1',
      )
      expect(request?.body).toContain('If-Match: W/"product-1"')
    }
    expect(new Headers(v4?.headers).get('odata-version')).toBe('4.0')
    expect(new Headers(v2?.headers).get('dataserviceversion')).toBe('2.0')
    expect(new Headers(v2?.headers).get('odata-version')).toBeNull()
  })

  it('owns bounded request-scoped SAP Gateway V2 navigation changesets', async () => {
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
      'HTTP/1.1 204 No Content',
      '',
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
      'HTTP/1.1 204 No Content',
      '',
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
      'HTTP/1.1 204 No Content',
      '',
      '',
      '--changeset_response',
      'Content-Type: application/http',
      'Content-Transfer-Encoding: binary',
      '',
      'HTTP/1.1 204 No Content',
      '',
      '',
      '--changeset_response--',
      '--batch_response--',
      '',
    ].join('\r\n')
    const requestFetch = vi.fn<typeof globalThis.fetch>(async () => new Response(responseBody, {
      headers: { 'Content-Type': 'multipart/mixed; boundary=batch_response' },
    }))
    const service = createODataServerMutationService(createEvent(requestFetch), 'catalog')

    expect(service.supportsV2AtomicChangesets).toBe(true)
    expect(service.supportsV2AtomicNavigationMutations).toBe(true)
    expect(service.supportsV2AtomicNavigationReferences).toBe(true)
    expect(service.supportsV2AtomicActionChangesets).toBe(true)
    await expect(service.v2ChangeSet([{
      kind: 'update',
      entitySet: 'Products',
      key: 1,
      body: { Name: 'Legacy root' },
      headers: { 'If-Match': 'W/"root-1"' },
    }, {
      kind: 'function-import',
      name: 'ApproveProducts',
      invocation: {
        method: 'POST',
        parameters: {
          ID: { type: 'Edm.Int32', value: 1 },
          Reason: { type: 'Edm.String', value: 'Ready' },
        },
      },
      headers: { 'If-Match': 'W/"action-1"' },
    }, {
      kind: 'update-navigation',
      entitySet: 'Products',
      key: 1,
      navigationPath: ['Reviews'],
      targetKey: 3,
      body: { Text: 'Legacy review' },
      headers: { 'If-Match': 'W/"review-3"' },
    }, {
      kind: 'create-navigation',
      entitySet: 'Products',
      key: 1,
      navigationPath: ['Reviews'],
      body: { ID: 4, Text: 'New legacy review' },
    }, {
      kind: 'delete-navigation',
      entitySet: 'Products',
      key: 1,
      navigationPath: ['Reviews'],
      targetKey: 2,
      headers: { 'If-Match': 'W/"review-2"' },
    }, {
      kind: 'link-navigation',
      entitySet: 'Products',
      key: 1,
      navigationPath: ['Tags'],
      targetEntitySet: 'Tags',
      targetKey: 'A/B',
    }, {
      kind: 'unlink-navigation',
      entitySet: 'Products',
      key: 1,
      navigationPath: ['Tags'],
      targetKey: 'old',
    }])).resolves.toEqual([
      { status: 204, headers: {} },
      { status: 204, headers: {} },
      { status: 204, headers: {} },
      { status: 204, headers: {} },
      { status: 204, headers: {} },
      { status: 204, headers: {} },
      { status: 204, headers: {} },
    ])

    const [request, init] = requestFetch.mock.calls[0]!
    expect(requestUrl(request)).toBe('/api/odx/catalog-api/$batch')
    const headers = new Headers(init?.headers)
    expect(headers.get('dataserviceversion')).toBe('2.0')
    expect(headers.get('maxdataserviceversion')).toBe('2.0')
    expect(headers.get('odata-version')).toBeNull()
    expect(init?.body).toContain('MERGE Products(1) HTTP/1.1')
    expect(init?.body).toContain(
      'POST ApproveProducts?ID=1&Reason=%27Ready%27 HTTP/1.1',
    )
    expect(init?.body).toContain('MERGE Products(1)/Reviews(3) HTTP/1.1')
    expect(init?.body).toContain('POST Products(1)/Reviews HTTP/1.1')
    expect(init?.body).toContain('"Text":"New legacy review"')
    expect(init?.body).toContain('DELETE Products(1)/Reviews(2) HTTP/1.1')
    expect(init?.body).toContain('POST Products(1)/$links/Tags HTTP/1.1')
    expect(init?.body).toContain('{"uri":"Tags(\'A%2FB\')"}')
    expect(init?.body).toContain('DELETE Products(1)/$links/Tags(\'old\') HTTP/1.1')
    expect(init?.body).toContain('If-Match: W/"root-1"')
    expect(init?.body).toContain('If-Match: W/"action-1"')
    expect(init?.body).toContain('If-Match: W/"review-3"')
    expect(init?.body).toContain('If-Match: W/"review-2"')

    await expect(service.v2ChangeSet([{
      kind: 'function-import',
      name: 'GetSummary',
      invocation: { method: 'GET' },
    } as any])).rejects.toThrow('explicit POST method')
    await expect(service.v2ChangeSet([{
      kind: 'action',
      scope: 'service',
      action: 'Catalog.Reset',
    } as any])).rejects.toThrow('Unsupported OData V2 changeset mutation')
    expect(requestFetch).toHaveBeenCalledOnce()
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
