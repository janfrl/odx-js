import { describe, expect, it, vi } from 'vitest'
import { useOData } from '../src/runtime/composables/useOData'

// Mock Nuxt-specific imports
vi.mock('#imports', () => ({
  useFetch: vi.fn(url => ({ url })), // Return url for inspection
  useRuntimeConfig: vi.fn(() => ({
    public: {
      odata: {
        basePath: '/api/odx',
        services: [],
      },
    },
  })),
}))

describe('useOData Composable', () => {
  it('formats single keys correctly', () => {
    const api = useOData('MyService')
    const result = api.entitySet('Products').get('abc') as any
    expect(result.url).toBe(`/api/odx/MyService/Products('abc')`)
  })

  it('formats numeric keys without quotes', () => {
    const api = useOData('MyService')
    const result = api.entitySet('Products').get(123) as any
    expect(result.url).toBe('/api/odx/MyService/Products(123)')
  })

  it('formats composite keys correctly', () => {
    const api = useOData('MyService')
    const result = api.entitySet('Items').get({ ID: 1, Type: 'A' }) as any
    expect(result.url).toBe(`/api/odx/MyService/Items(ID=1,Type='A')`)
  })

  it('constructs list URLs correctly', () => {
    const api = useOData('MyService')
    const result = api.entitySet('Products').list() as any
    expect(result.url).toBe('/api/odx/MyService/Products')
  })
})
