import { describe, expect, it } from 'vitest'
import {
  createODataEntityPath,
  formatODataKey,
  formatODataNavigationPath,
  joinODataPath,
  validateODataIdentifier,
  validateODataQualifiedName,
} from '../src/odata-path'

describe('portable OData resource paths', () => {
  it('formats primitive and composite keys without losing field order', () => {
    expect(formatODataKey(7)).toBe('7')
    expect(formatODataKey(true)).toBe('true')
    expect(formatODataKey('A/B\'s')).toBe('\'A%2FB\'\'s\'')
    expect(formatODataKey({ ID: 'A/B', IsActiveEntity: false }))
      .toBe('ID=\'A%2FB\',IsActiveEntity=false')
  })

  it('rejects empty composite keys and unsafe key field names', () => {
    expect(() => formatODataKey({})).toThrow('at least one field')
    expect(() => formatODataKey({ '../ID': 1 })).toThrow('valid identifier')
  })

  it('validates entity, action, and navigation identifiers', () => {
    expect(validateODataIdentifier('Products')).toBe('Products')
    expect(validateODataQualifiedName('CatalogService.draftEdit'))
      .toBe('CatalogService.draftEdit')
    expect(formatODataNavigationPath('Items/Supplier')).toBe('Items/Supplier')
    expect(formatODataNavigationPath(['Items', 'Supplier'])).toBe('Items/Supplier')

    expect(() => validateODataIdentifier('../Products')).toThrow('valid identifier')
    expect(() => validateODataQualifiedName('draftEdit')).toThrow('qualified name')
    expect(() => formatODataNavigationPath(['Items', '../Supplier']))
      .toThrow('valid identifier segments')
  })

  it('joins URL and relative path fragments without corrupting schemes', () => {
    expect(joinODataPath('https://example.test/odata/', '/Products/', '/Reviews'))
      .toBe('https://example.test/odata/Products/Reviews')
    expect(joinODataPath('/api/odx/', 'catalog')).toBe('/api/odx/catalog')
  })

  it('creates exact entity resource paths', () => {
    expect(createODataEntityPath('Products', { ID: '1', IsActiveEntity: false }))
      .toBe('Products(ID=\'1\',IsActiveEntity=false)')
    expect(() => createODataEntityPath('../Products', 1)).toThrow('valid identifier')
  })
})
