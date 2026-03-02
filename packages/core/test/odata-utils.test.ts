import { describe, expect, it } from 'vitest'
import { flattenOData, mergeHeaders, sanitizeBaseURL, stringifyQuery } from '../src/odata-utils'

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
        other: 'param',
      }

      const result = stringifyQuery(query)
      expect(result.$filter).toBe('Name eq \'Test\'')
      expect(result.$top).toBe('10')
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
})
