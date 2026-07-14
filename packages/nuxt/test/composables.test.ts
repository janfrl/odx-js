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
    globalThis.$fetch = vi.fn() as any
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
