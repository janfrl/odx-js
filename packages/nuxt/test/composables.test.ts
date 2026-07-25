import * as core from '@me-tools/odx-core'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const runtimeConfig = vi.hoisted(() => ({
  public: {
    odata: {
      basePath: '/api/odx',
      services: [
        { name: 'RoutedService', url: 'https://example.com/routed', route: 'routed-api', strategy: 'proxied' },
        { name: 'DirectService', url: 'https://external.com/odata', strategy: 'direct' },
      ],
    },
  },
}))

// Mock Nuxt-specific imports
vi.mock('#imports', () => ({
  useFetch: vi.fn((url, options) => ({ url, options })),
  useRuntimeConfig: vi.fn(() => runtimeConfig),
}))

// Mock core library
vi.mock('@me-tools/odx-core', async () => {
  const actual = await vi.importActual('@me-tools/odx-core')
  return {
    ...actual as any,
    $odata: vi.fn(() => Promise.resolve({ success: true })),
    flattenOData: vi.fn(data => data),
    stringifyQuery: vi.fn(q => q),
  }
})

const { useOData } = await import('../src/runtime/composables/useOData')

describe('useOData Composable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    const fetchMock = vi.fn() as any
    fetchMock.raw = vi.fn()
    globalThis.$fetch = fetchMock
    runtimeConfig.public.odata.basePath = '/api/odx'
    runtimeConfig.public.odata.services = [
      { name: 'RoutedService', url: 'https://example.com/routed', route: 'routed-api', strategy: 'proxied' },
      { name: 'DirectService', url: 'https://external.com/odata', strategy: 'direct' },
    ]
  })

  describe('key Formatting', () => {
    it('formats single keys correctly', () => {
      const api = useOData('MyService')
      const result = api.entitySet('Products').get('abc') as any
      expect(result.url).toBe('/api/odx/MyService/Products(\'abc\')')
    })

    it('uri-encodes string key literal content', () => {
      const api = useOData('MyService')
      const result = api.entitySet('Products').get('A/B?x=1&R') as any
      expect(result.url).toBe('/api/odx/MyService/Products(\'A%2FB%3Fx%3D1%26R\')')
    })

    it('escapes single quotes in string keys', () => {
      const api = useOData('MyService')
      const result = api.entitySet('Products').get('O\'Brien') as any
      expect(result.url).toBe('/api/odx/MyService/Products(\'O\'\'Brien\')')
    })

    it('formats numeric keys without quotes', () => {
      const api = useOData('MyService')
      const result = api.entitySet('Products').get(123) as any
      expect(result.url).toBe('/api/odx/MyService/Products(123)')
    })

    it('formats composite keys correctly', () => {
      const api = useOData('MyService')
      const result = api.entitySet('Items').get({ ID: 1, Type: 'A' }) as any
      expect(result.url).toBe('/api/odx/MyService/Items(ID=1,Type=\'A\')')
    })

    it('uri-encodes composite string key literal content', () => {
      const api = useOData('MyService')
      const result = api.entitySet('Items').get({ ID: 1, Type: 'A/B?x=1&R' }) as any
      expect(result.url).toBe('/api/odx/MyService/Items(ID=1,Type=\'A%2FB%3Fx%3D1%26R\')')
    })

    it('escapes single quotes in composite string keys', () => {
      const api = useOData('MyService')
      const result = api.entitySet('Items').get({ ID: 1, Type: 'Bob\'s' }) as any
      expect(result.url).toBe('/api/odx/MyService/Items(ID=1,Type=\'Bob\'\'s\')')
    })
  })

  describe('uRL Construction', () => {
    it('constructs list URLs correctly for proxied services', () => {
      const api = useOData('MyService')
      const result = api.entitySet('Products').list() as any
      expect(result.url).toBe('/api/odx/MyService/Products')
    })

    it('constructs proxied list URLs with the configured service route', () => {
      const api = useOData('RoutedService' as any)
      const result = api.entitySet('Products').list() as any
      expect(result.url).toBe('/api/odx/routed-api/Products')
    })

    it('constructs URLs correctly for direct (HTTP) services', () => {
      // DirectService is configured with a full URL in the mock
      const api = useOData('DirectService' as any)
      const result = api.entitySet('Products').list() as any
      expect(result.url).toBe('https://external.com/odata/Products')
    })

    it('normalizes direct service URLs with trailing slashes', () => {
      runtimeConfig.public.odata.services.push({
        name: 'DirectSlashService',
        url: 'https://external.com/odata/',
        strategy: 'direct',
      })

      const api = useOData('DirectSlashService' as any)
      const result = api.entitySet('Products').list() as any
      expect(result.url).toBe('https://external.com/odata/Products')
    })

    it('normalizes proxied base paths and routes with boundary slashes', () => {
      runtimeConfig.public.odata.basePath = '/api/odx/'
      runtimeConfig.public.odata.services.push({
        name: 'RoutedSlashService',
        url: 'https://example.com/routed',
        route: '/routed-api/',
        strategy: 'proxied',
      })

      const api = useOData('RoutedSlashService' as any)
      const result = api.entitySet('Products').list() as any
      expect(result.url).toBe('/api/odx/routed-api/Products')
    })

    it('handles service calls without entity sets (service root)', () => {
      const api = useOData('MyService')
      const result = (api as any).list()
      expect(result.url).toBe('/api/odx/MyService')
    })
  })

  describe('imperative reads', () => {
    it('uses the promise transport and forwards cancellation', async () => {
      const signal = new AbortController().signal
      const api = useOData('RoutedService' as any)

      await api.entitySet('Products').fetchList(
        { $select: ['ID', 'Name'], $top: 2 },
        { signal },
      )

      expect(core.$odata).toHaveBeenCalledWith(
        expect.any(Function),
        '/api/odx/routed-api/Products',
        'GET',
        {
          query: { $select: ['ID', 'Name'], $top: 2 },
          signal,
        },
      )
    })

    it('reads a single entity and forwards query and cancellation', async () => {
      const signal = new AbortController().signal
      const api = useOData('RoutedService' as any)

      await api.entitySet('Products').fetchOne(
        { ID: 1, Locale: 'en' },
        { $select: ['ID', 'Name'] },
        { signal },
      )

      expect(core.$odata).toHaveBeenCalledWith(
        expect.any(Function),
        '/api/odx/routed-api/Products(ID=1,Locale=\'en\')',
        'GET',
        {
          query: { $select: ['ID', 'Name'] },
          signal,
        },
      )
    })
  })
  describe('mutations ($odata)', () => {
    it('calls $odata for create (POST)', async () => {
      const api = useOData('MyService')
      await api.entitySet('Products').create({ Name: 'New Product' })

      expect(core.$odata).toHaveBeenCalledWith(
        expect.any(Function),
        '/api/odx/MyService/Products',
        'POST',
        { body: { Name: 'New Product' } },
      )
    })

    it('calls $odata for routed service create using the configured route', async () => {
      const api = useOData('RoutedService' as any)
      await api.entitySet('Products').create({ Name: 'New Product' })

      expect(core.$odata).toHaveBeenCalledWith(
        expect.any(Function),
        '/api/odx/routed-api/Products',
        'POST',
        { body: { Name: 'New Product' } },
      )
    })

    it('creates a child through a validated navigation path', async () => {
      const api = useOData('RoutedService' as any)
      const signal = new AbortController().signal

      await api.entitySet('Products').createNavigation(
        { ID: 1, Locale: 'en' },
        ['Items'],
        { Product: 'Desk', Amount: '125.50' },
        { signal },
      )

      expect(core.$odata).toHaveBeenCalledWith(
        expect.any(Function),
        '/api/odx/routed-api/Products(ID=1,Locale=\'en\')/Items',
        'POST',
        {
          body: { Product: 'Desk', Amount: '125.50' },
          signal,
        },
      )
    })

    it('rejects empty or unsafe navigation paths', () => {
      const entitySet = useOData('MyService').entitySet('Products')

      expect(() => entitySet.createNavigation(1, [], {})).toThrow(TypeError)
      expect(() => entitySet.createNavigation(
        1,
        ['Items?$filter=ID'],
        {},
      )).toThrow(TypeError)
    })
    it('updates a single-valued navigation target', async () => {
      const api = useOData('RoutedService' as any)
      const headers = { 'If-Match': 'W/"supplier-1"' }

      await api.entitySet('Products').updateNavigation(
        { ID: 1, Locale: 'en' },
        ['Supplier'],
        { body: { Name: 'Modern Office GmbH' } },
        { headers },
      )

      expect(core.$odata).toHaveBeenCalledWith(
        expect.any(Function),
        '/api/odx/routed-api/Products(ID=1,Locale=\'en\')/Supplier',
        'PATCH',
        { body: { Name: 'Modern Office GmbH' }, headers },
      )
    })

    it('updates a keyed entity in a collection-valued navigation', async () => {
      const api = useOData('RoutedService' as any)

      await api.entitySet('Products').updateNavigation(
        1,
        ['Items'],
        {
          targetKey: { ItemID: 'A/B', Locale: 'en' },
          body: { Quantity: 3 },
        },
      )

      expect(core.$odata).toHaveBeenCalledWith(
        expect.any(Function),
        '/api/odx/routed-api/Products(1)/Items(ItemID=\'A%2FB\',Locale=\'en\')',
        'PATCH',
        { body: { Quantity: 3 } },
      )
    })

    it('rejects unsafe update navigation paths before transport', () => {
      const entitySet = useOData('MyService').entitySet('Products')

      expect(() => entitySet.updateNavigation(
        1,
        [],
        { body: { Name: 'Updated' } },
      )).toThrow(TypeError)
      expect(() => entitySet.updateNavigation(
        1,
        ['Items(1)'],
        { body: { Name: 'Updated' } },
      )).toThrow(TypeError)
    })

    it('calls $odata for update (PATCH)', async () => {
      const api = useOData('MyService')
      await api.entitySet('Products').update(1, { Name: 'Updated' })

      expect(core.$odata).toHaveBeenCalledWith(
        expect.any(Function),
        '/api/odx/MyService/Products(1)',
        'PATCH',
        { body: { Name: 'Updated' } },
      )
    })

    it('calls $odata for routed service update using the configured route and string key', async () => {
      const api = useOData('RoutedService' as any)
      await api.entitySet('Products').update('O\'Brien', { Name: 'Updated' })

      expect(core.$odata).toHaveBeenCalledWith(
        expect.any(Function),
        '/api/odx/routed-api/Products(\'O\'\'Brien\')',
        'PATCH',
        { body: { Name: 'Updated' } },
      )
    })

    it('uri-encodes string key literal content for routed update URLs', async () => {
      const api = useOData('RoutedService' as any)
      await api.entitySet('Products').update('A/B?x=1&R', { Name: 'Updated' })

      expect(core.$odata).toHaveBeenCalledWith(
        expect.any(Function),
        '/api/odx/routed-api/Products(\'A%2FB%3Fx%3D1%26R\')',
        'PATCH',
        { body: { Name: 'Updated' } },
      )
    })

    it('escapes single quotes in update keys', async () => {
      const api = useOData('MyService')
      await api.entitySet('Products').update('O\'Brien', { Name: 'Updated' })

      expect(core.$odata).toHaveBeenCalledWith(
        expect.any(Function),
        '/api/odx/MyService/Products(\'O\'\'Brien\')',
        'PATCH',
        { body: { Name: 'Updated' } },
      )
    })

    it('calls $odata for remove (DELETE)', async () => {
      const api = useOData('MyService')
      await api.entitySet('Products').remove('key1')

      expect(core.$odata).toHaveBeenCalledWith(
        expect.any(Function),
        '/api/odx/MyService/Products(\'key1\')',
        'DELETE',
      )
    })

    it('calls $odata for routed service remove using the configured route', async () => {
      const api = useOData('RoutedService' as any)
      await api.entitySet('Products').remove(1)

      expect(core.$odata).toHaveBeenCalledWith(
        expect.any(Function),
        '/api/odx/routed-api/Products(1)',
        'DELETE',
      )
    })

    it('escapes single quotes in remove keys', async () => {
      const api = useOData('MyService')
      await api.entitySet('Products').remove({ ID: 'Bob\'s', Locale: 'en' })

      expect(core.$odata).toHaveBeenCalledWith(
        expect.any(Function),
        '/api/odx/MyService/Products(ID=\'Bob\'\'s\',Locale=\'en\')',
        'DELETE',
      )
    })

    it('forwards mutation cancellation and concurrency headers', async () => {
      const api = useOData('MyService')
      const signal = new AbortController().signal
      const headers = { 'If-Match': 'W/"product-1"' }

      await api.entitySet('Products').update(
        1,
        { Name: 'Updated' },
        { headers, signal },
      )
      await api.entitySet('Products').remove(1, { headers, signal })

      expect(core.$odata).toHaveBeenNthCalledWith(
        1,
        expect.any(Function),
        '/api/odx/MyService/Products(1)',
        'PATCH',
        { body: { Name: 'Updated' }, headers, signal },
      )
      expect(core.$odata).toHaveBeenNthCalledWith(
        2,
        expect.any(Function),
        '/api/odx/MyService/Products(1)',
        'DELETE',
        { headers, signal },
      )
    })

    it('invokes service, collection, and entity-bound actions', async () => {
      const api = useOData('MyService')
      const signal = new AbortController().signal

      await api.invoke('Demo.ResetCatalog', {
        parameters: { KeepAudit: true },
      }, { signal })
      await api.entitySet('Products').invoke('Demo.ReleaseAll')
      await api.entitySet('Products').invoke('Demo.ArchiveProduct', {
        key: { ID: 1, Active: true },
        parameters: { Reason: 'obsolete' },
      })

      expect(core.$odata).toHaveBeenNthCalledWith(
        1,
        expect.any(Function),
        '/api/odx/MyService/Demo.ResetCatalog',
        'POST',
        { body: { KeepAudit: true }, signal },
      )
      expect(core.$odata).toHaveBeenNthCalledWith(
        2,
        expect.any(Function),
        '/api/odx/MyService/Products/Demo.ReleaseAll',
        'POST',
        { body: {} },
      )
      expect(core.$odata).toHaveBeenNthCalledWith(
        3,
        expect.any(Function),
        '/api/odx/MyService/Products(ID=1,Active=true)/Demo.ArchiveProduct',
        'POST',
        { body: { Reason: 'obsolete' } },
      )
    })

    it('rejects action names that could alter the request path', () => {
      const api = useOData('MyService')

      expect(() => api.invoke('../Demo.Reset')).toThrow('qualified name')
      expect(core.$odata).not.toHaveBeenCalled()
    })
  })

  describe('atomic changesets', () => {
    it('posts root and navigation updates as one service-level batch', async () => {
      const signal = new AbortController().signal
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
      const raw = (globalThis.$fetch as any).raw as ReturnType<typeof vi.fn>
      raw.mockResolvedValue({
        _data: responseBody,
        headers: { get: vi.fn(() => 'multipart/mixed; boundary=batch_response') },
      })
      const api = useOData('RoutedService' as any)

      const responses = await api.changeSet([
        {
          kind: 'update',
          entitySet: 'Products',
          key: 1,
          body: { Name: 'Updated product' },
          headers: { 'If-Match': 'W/"product-1"' },
        },
        {
          kind: 'update-navigation',
          entitySet: 'Products',
          key: 1,
          navigationPath: ['Supplier'],
          targetKey: 2,
          body: { Name: 'Updated supplier' },
          headers: { 'If-Match': 'W/"supplier-2"' },
        },
      ], { signal, headers: { 'X-Correlation-ID': 'test-1' } })

      expect(responses).toEqual([
        { status: 204, headers: {} },
        {
          status: 200,
          headers: { 'content-type': 'application/json' },
          body: { ID: 2, Name: 'Updated supplier' },
        },
      ])
      expect(raw).toHaveBeenCalledOnce()
      const [url, options] = raw.mock.calls[0] as [string, any]
      expect(url).toBe('/api/odx/routed-api/$batch')
      expect(options).toMatchObject({
        method: 'POST',
        signal,
        headers: {
          accept: 'multipart/mixed',
          'odata-version': '4.0',
          'x-correlation-id': 'test-1',
        },
      })
      expect(options.headers['content-type']).toMatch(/^multipart\/mixed; boundary=batch_/u)
      expect(options.body).toContain('PATCH Products(1) HTTP/1.1')
      expect(options.body).toContain('PATCH Products(1)/Supplier(2) HTTP/1.1')
      expect(options.body).toContain('If-Match: W/"product-1"')
      expect(options.body).toContain('If-Match: W/"supplier-2"')
    })

    it('uses the configured direct service root for batch requests', async () => {
      const raw = (globalThis.$fetch as any).raw as ReturnType<typeof vi.fn>
      raw.mockResolvedValue({
        _data: [
          '--batch_response',
          'Content-Type: application/http',
          '',
          'HTTP/1.1 204 No Content',
          '',
          '',
          '--batch_response--',
          '',
        ].join('\r\n'),
        headers: { get: vi.fn(() => 'multipart/mixed; boundary=batch_response') },
      })

      await useOData('DirectService' as any).changeSet([
        { kind: 'update', entitySet: 'Products', key: 'A/B', body: { Active: true } },
      ])

      expect(raw).toHaveBeenCalledWith(
        'https://external.com/odata/$batch',
        expect.objectContaining({ method: 'POST' }),
      )
      expect(raw.mock.calls[0]?.[1].body).toContain("PATCH Products('A%2FB') HTTP/1.1")
    })

    it('rejects unsafe entity and navigation path segments before transport', async () => {
      const raw = (globalThis.$fetch as any).raw as ReturnType<typeof vi.fn>
      const api = useOData('MyService')

      await expect(api.changeSet([
        { kind: 'update', entitySet: '../Products', key: 1, body: {} },
      ])).rejects.toThrow('valid identifier')
      await expect(api.changeSet([
        {
          kind: 'update-navigation',
          entitySet: 'Products',
          key: 1,
          navigationPath: ['../Supplier'],
          body: {},
        },
      ])).rejects.toThrow('valid identifier segments')
      expect(raw).not.toHaveBeenCalled()
    })
  })

  describe('proxy Behavior', () => {
    it('supports dot notation for entity sets', () => {
      const api = useOData('MyService')
      const result = (api as any).Products.list()
      expect(result.url).toBe('/api/odx/MyService/Products')
    })

    it('supports dot notation for services from root useOData()', () => {
      const odx = useOData()
      const result = (odx as any).MyService.Products.list()
      expect(result.url).toBe('/api/odx/MyService/Products')
    })

    it('ignores internal symbols and properties in proxy', () => {
      const odx = useOData() as any
      expect(odx.toJSON).toBeUndefined()
      expect(odx.then).toBeUndefined()

      const service = useOData('Svc') as any
      expect(service.toJSON).toBeUndefined()
      expect(service.then).toBeUndefined()
    })
  })
})
