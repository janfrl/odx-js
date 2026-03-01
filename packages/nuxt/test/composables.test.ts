import { describe, expect, it, vi } from 'vitest'
import { useOData } from '../src/runtime/composables/useOData'

// Mock Nuxt-specific imports
vi.mock('#imports', () => ({
  useFetch: vi.fn((url) => ({ url })), // Return url for inspection
  useODataBasePath: vi.fn((service) => `/api/sap-odata`)
}))

describe('useOData Composable', () => {
  it('formats single keys correctly', () => {
    const api = useOData('MyService' as any)
    const result = (api.entities('Products') as any).get('abc')
    expect(result.url).toBe(`/api/sap-odata/MyService/Products('abc')`)
  })

  it('formats numeric keys without quotes', () => {
    const api = useOData('MyService' as any)
    const result = (api.entities('Products') as any).get(123)
    expect(result.url).toBe('/api/sap-odata/MyService/Products(123)')
  })

  it('formats composite keys correctly', () => {
    const api = useOData('MyService' as any)
    const result = (api.entities('Items') as any).get({ ID: 1, Type: 'A' })
    expect(result.url).toBe(`/api/sap-odata/MyService/Items(ID=1,Type='A')`)
  })

  it('constructs list URLs correctly', () => {
    const api = useOData('MyService' as any)
    const result = (api.entities('Products') as any).list()
    expect(result.url).toBe('/api/sap-odata/MyService/Products')
  })
})
