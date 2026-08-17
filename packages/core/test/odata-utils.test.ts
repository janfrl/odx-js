import { describe, expect, it } from 'vitest'
import { flattenOData, mergeHeaders, sanitizeBaseURL, stringifyQuery, toODataCollectionPage } from '../src/odata-utils'

describe('oData Utils', () => {
  describe('sanitizeBaseURL', () => {
    it('removes trailing slashes', () => {
      expect(sanitizeBaseURL('http://sap.com/')).toBe('http://sap.com')
      expect(sanitizeBaseURL('http://sap.com/odata/')).toBe('http://sap.com/odata')
    })

    it('collapses multiple slashes but preserves protocol', () => {
      expect(sanitizeBaseURL('http://sap.com//odata///test')).toBe('http://sap.com/odata/test')
    })

    it('handles empty input gracefully', () => {
      expect(sanitizeBaseURL('')).toBe('')
    })
  })

  describe('mergeHeaders', () => {
    it('merges different header formats into lowercase record', () => {
      const h1 = { 'Authorization': 'Bearer 123', 'X-Test': 'val1' }
      const h2 = new Headers({ 'x-test': 'val2', 'Content-Type': 'application/json' })

      const merged = mergeHeaders(h1, h2)

      expect(merged.authorization).toBe('Bearer 123')
      expect(merged['x-test']).toBe('val2')
      expect(merged['content-type']).toBe('application/json')
    })

    it('handles array-based headers', () => {
      const h1 = [['Accept', 'application/json']] as [string, string][]
      const h2 = { 'X-Custom': 'foo' }

      const merged = mergeHeaders(h1, h2)
      expect(merged.accept).toBe('application/json')
      expect(merged['x-custom']).toBe('foo')
    })
  })

  describe('stringifyQuery', () => {
    it('converts OData parameters correctly', () => {
      const query = {
        $filter: 'Name eq \'Test\'',
        $top: 10,
        $expand: 'Category',
        $count: true,
        other: 'param',
      }

      const result = stringifyQuery(query)
      expect(result.$filter).toBe('Name eq \'Test\'')
      expect(result.$top).toBe('10')
      expect(result.$count).toBe('true')
      expect(result.other).toBe('param')
    })

    it('filters out undefined and null values', () => {
      const result = stringifyQuery({ val: null, other: undefined, keep: 'yes' })
      expect(result).toEqual({ keep: 'yes' })
    })
  })

  describe('flattenOData', () => {
    it('unwraps OData V2 results array', () => {
      const data = {
        d: {
          results: [{ ID: 1, Name: 'A' }, { ID: 2, Name: 'B' }],
        },
      }
      const flattened = flattenOData(data.d)
      expect(Array.isArray(flattened)).toBe(true)
      expect(flattened).toHaveLength(2)
      expect(flattened[0].Name).toBe('A')
    })

    it('unwraps falsy scalar OData V2 d envelopes', () => {
      expect(flattenOData({ d: 0 })).toBe(0)
      expect(flattenOData({ d: false })).toBe(false)
      expect(flattenOData({ d: '' })).toBe('')
    })

    it('preserves ordinary entity properties named d when other fields exist', () => {
      const flattened = flattenOData({
        ID: 1,
        d: false,
      })

      expect(flattened).toEqual({
        ID: 1,
        d: false,
      })
    })

    it('unwraps OData V4 value collection envelopes', () => {
      const data = {
        '@odata.count': 2,
        'value': [{ ID: 1, Name: 'A' }, { ID: 2, Name: 'B' }],
      }

      const flattened = flattenOData(data)

      expect(Array.isArray(flattened)).toBe(true)
      expect(flattened).toHaveLength(2)
      expect(flattened[0].Name).toBe('A')
      expect(flattened.totalCount).toBe(2)
    })

    it('preserves scalar entity properties named value', () => {
      const flattened = flattenOData({
        ID: 1,
        value: 'retail',
      })

      expect(flattened).toEqual({
        ID: 1,
        value: 'retail',
      })
    })

    it('preserves and flattens nested entity properties named value', () => {
      const flattened = flattenOData({
        ID: 1,
        value: {
          amount: 12,
          __metadata: { type: 'Ignored' },
        },
      })

      expect(flattened).toEqual({
        ID: 1,
        value: {
          amount: 12,
        },
      })
    })

    it('preserves __count as totalCount', () => {
      const data = {
        results: [{ ID: 1 }],
        __count: '100',
      }
      const flattened = flattenOData(data)
      expect(flattened.totalCount).toBe(100)
    })

    it('strips metadata and deferred tags', () => {
      const data = {
        ID: 1,
        __metadata: { type: 'Test' },
        Sub: {
          __deferred: { uri: '...' },
        },
      }
      const flattened = flattenOData(data)
      expect(flattened.ID).toBe(1)
      expect(flattened.__metadata).toBeUndefined()
      expect(flattened.Sub).toBeNull()
    })

    it('protects against deep recursion', () => {
      const deep: any = { a: {} }
      let curr = deep.a
      for (let i = 0; i < 20; i++) {
        curr.b = {}
        curr = curr.b
      }
      const flattened = flattenOData(deep)
      const json = JSON.stringify(flattened)
      expect(json).toContain('[Max Depth Reached]')
    })

    it('handles binary data (Uint8Array) by truncating', () => {
      const data = { bin: new Uint8Array([1, 2, 3, 4, 5]) }
      const flattened = flattenOData(data)
      expect(flattened.bin).toBe('[Binary Data, 5 bytes]')
    })
  })

  describe('toODataCollectionPage', () => {
    it('returns an SSR-serializable V2 page with an explicit count', () => {
      const page = toODataCollectionPage<{ ID: number }>({
        d: {
          __count: '49',
          results: [{ ID: 1, __metadata: { type: 'Demo.Product' } }],
        },
      })

      expect(page).toEqual({ items: [{ ID: 1 }], totalCount: 49 })
      expect(JSON.parse(JSON.stringify(page))).toEqual(page)
    })

    it('normalizes an OData V4 count', () => {
      expect(toODataCollectionPage<{ ID: number }>({
        '@odata.count': 2,
        'value': [{ ID: 1 }, { ID: 2 }],
      })).toEqual({
        items: [{ ID: 1 }, { ID: 2 }],
        totalCount: 2,
      })
    })

    it('preserves a count from an already flattened imperative response', () => {
      const items = [{ ID: 1 }] as Array<{ ID: number }> & { totalCount?: number }
      items.totalCount = 0

      expect(toODataCollectionPage<{ ID: number }>(items)).toEqual({
        items: [{ ID: 1 }],
        totalCount: 0,
      })
    })

    it('preserves a numeric zero count from a raw collection envelope', () => {
      expect(toODataCollectionPage({ results: [], __count: 0 })).toEqual({
        items: [],
        totalCount: 0,
      })
    })

    it('rejects non-collection responses', () => {
      expect(() => toODataCollectionPage({ d: { ID: 1 } })).toThrow('collection response')
    })

    it.each([
      '',
      ' ',
      '1e2',
      '0x10',
      'many',
      -1,
      1.5,
      Number.MAX_SAFE_INTEGER + 1,
      false,
      true,
      null,
      [],
    ])('rejects the malformed count %j', (count) => {
      expect(() => toODataCollectionPage({ results: [], __count: count })).toThrow('non-negative safe integer')
    })
  })
})
