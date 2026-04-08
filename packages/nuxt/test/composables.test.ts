import { describe, expect, it, vi, beforeEach } from 'vitest'
import { useOData } from '../src/runtime/composables/useOData'
import * as core from '@bc8-odx/core'

// Mock Nuxt-specific imports
vi.mock('#imports', () => ({
  useFetch: vi.fn((url, options) => ({ url, options })),
  useRuntimeConfig: vi.fn(() => ({
    public: {
      odata: {
        basePath: '/api/odx',
        services: [
          { name: 'DirectService', url: 'https://external.com/odata', strategy: 'direct' }
        ],
      },
    },
  })),
}))

// Mock core library
vi.mock('@bc8-odx/core', async () => {
  const actual = await vi.importActual('@bc8-odx/core')
  return {
    ...actual as any,
    $odata: vi.fn(() => Promise.resolve({ success: true })),
    flattenOData: vi.fn(data => data),
    stringifyQuery: vi.fn(q => q),
  }
})

describe('useOData Composable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    globalThis.$fetch = vi.fn() as any
  })

  describe('Key Formatting', () => {
    it('formats single keys correctly', () => {
      const api = useOData('MyService')
      const result = api.entitySet('Products').get('abc') as any
      expect(result.url).toBe("/api/odx/MyService/Products('abc')")
    })

    it('formats numeric keys without quotes', () => {
      const api = useOData('MyService')
      const result = api.entitySet('Products').get(123) as any
      expect(result.url).toBe('/api/odx/MyService/Products(123)')
    })

    it('formats composite keys correctly', () => {
      const api = useOData('MyService')
      const result = api.entitySet('Items').get({ ID: 1, Type: 'A' }) as any
      expect(result.url).toBe("/api/odx/MyService/Items(ID=1,Type='A')")
    })
  })

  describe('URL Construction', () => {
    it('constructs list URLs correctly for proxied services', () => {
      const api = useOData('MyService')
      const result = api.entitySet('Products').list() as any
      expect(result.url).toBe('/api/odx/MyService/Products')
    })

    it('constructs URLs correctly for direct (HTTP) services', () => {
      // DirectService is configured with a full URL in the mock
      const api = useOData('DirectService' as any)
      const result = api.entitySet('Products').list() as any
      expect(result.url).toBe('https://external.com/odata/Products')
    })
    
    it('handles service calls without entity sets (service root)', () => {
        const api = useOData('MyService')
        const result = (api as any).list()
        expect(result.url).toBe('/api/odx/MyService')
    })
  })

  describe('Mutations ($odata)', () => {
    it('calls $odata for create (POST)', async () => {
      const api = useOData('MyService')
      await api.entitySet('Products').create({ Name: 'New Product' })
      
      expect(core.$odata).toHaveBeenCalledWith(
        expect.any(Function),
        '/api/odx/MyService/Products',
        'POST',
        { body: { Name: 'New Product' } }
      )
    })

    it('calls $odata for update (PATCH)', async () => {
      const api = useOData('MyService')
      await api.entitySet('Products').update(1, { Name: 'Updated' })
      
      expect(core.$odata).toHaveBeenCalledWith(
        expect.any(Function),
        '/api/odx/MyService/Products(1)',
        'PATCH',
        { body: { Name: 'Updated' } }
      )
    })

    it('calls $odata for remove (DELETE)', async () => {
      const api = useOData('MyService')
      await api.entitySet('Products').remove('key1')
      
      expect(core.$odata).toHaveBeenCalledWith(
        expect.any(Function),
        "/api/odx/MyService/Products('key1')",
        'DELETE'
      )
    })
  })

  describe('Proxy Behavior', () => {
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
