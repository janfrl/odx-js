import { describe, expect, it } from 'vitest'
import {
  createODataEntityPath,
  createODataEntityReference,
  createODataNavigationSourcePath,
  formatODataFunctionCall,
  formatODataFunctionParameter,
  formatODataKey,
  formatODataNavigationPath,
  joinODataPath,
  validateODataIdentifier,
  validateODataQualifiedName,
} from '../src/odata-path'

describe('portable OData resource paths', () => {
  it('formats typed OData V4 function parameters without path injection', () => {
    expect(formatODataFunctionCall('Catalog.GetDefaults', {
      Name: { type: 'Edm.String', value: 'A/B\'s desk' },
      Quantity: { type: 'Edm.Int32', value: 2 },
      Active: { type: 'Edm.Boolean', value: true },
      At: { type: 'Edm.DateTimeOffset', value: '2026-07-29T09:15:00+02:00' },
    })).toBe(
      'Catalog.GetDefaults(Name=\'A%2FB\'\'s%20desk\',Quantity=2,Active=true,At=2026-07-29T09%3A15%3A00%2B02%3A00)',
    )
    expect(formatODataFunctionCall('Catalog.GetDefaults')).toBe('Catalog.GetDefaults()')
    expect(formatODataFunctionParameter({ type: 'Edm.Duration', value: 'PT15M' }))
      .toBe('duration\'PT15M\'')
    expect(formatODataFunctionParameter({ type: 'Edm.Guid', value: null })).toBe('null')
  })

  it('rejects unsafe function names, parameter names, types, and values', () => {
    expect(() => formatODataFunctionCall('../Catalog.GetDefaults')).toThrow('qualified name')
    expect(() => formatODataFunctionCall('Catalog.GetDefaults', {
      '../Name': { type: 'Edm.String', value: 'Desk' },
    })).toThrow('valid identifier')
    expect(() => formatODataFunctionParameter({ type: 'Edm.Int32', value: 1.5 }))
      .toThrow('invalid value')
    expect(() => formatODataFunctionParameter({ type: 'Edm.Guid', value: 'not-a-guid' }))
      .toThrow('invalid value')
    expect(() => formatODataFunctionParameter({ type: 'Catalog.Complex', value: 'x' }))
      .toThrow('Unsupported')
  })
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
  it('creates service-relative entity references without accepting paths', () => {
    expect(createODataEntityReference('Categories', { ID: 'A/B' }))
      .toEqual({ '@odata.id': 'Categories(ID=\'A%2FB\')' })
    expect(() => createODataEntityReference('../Categories', 1))
      .toThrow('valid identifier')
  })
  it('creates exact contained navigation source paths', () => {
    expect(createODataNavigationSourcePath('Products', {
      kind: 'contained-entity',
      rootKey: { ID: 1, IsActiveEntity: false },
      path: [
        { navigationPath: ['Category', 'Items'], key: { ItemID: 'A/B' } },
        { navigationPath: ['Schedules'], key: 3 },
      ],
    })).toBe(
      'Products(ID=1,IsActiveEntity=false)/Category/Items(ItemID=\'A%2FB\')/Schedules(3)',
    )
  })

  it('rejects empty and unsafe contained navigation sources', () => {
    expect(() => createODataNavigationSourcePath('Products', {
      kind: 'contained-entity',
      rootKey: 1,
      path: [],
    })).toThrow('at least one keyed containment segment')
    expect(() => createODataNavigationSourcePath('Products', {
      kind: 'contained-entity',
      rootKey: 1,
      path: [{ navigationPath: ['../Items'], key: 2 }],
    })).toThrow('valid identifier')
  })
})
