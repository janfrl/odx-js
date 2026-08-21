import { describe, expect, it } from 'vitest'
import {
  createODataEntityPath,
  createODataEntityReference,
  createODataMediaPath,
  createODataNavigationRootReference,
  createODataNavigationSourcePath,
  formatODataFunctionCall,
  formatODataFunctionParameter,
  formatODataKey,
  formatODataNavigationPath,
  formatODataV2FunctionImportParameters,
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

  it('formats typed OData V2 FunctionImport query parameters', () => {
    expect(formatODataV2FunctionImportParameters({
      ID: { type: 'Edm.Guid', value: '01234567-89ab-cdef-0123-456789abcdef' },
      Reason: { type: 'Edm.String', value: 'A/B\'s desk' },
      Count: { type: 'Edm.Int32', value: 2 },
      Amount: { type: 'Edm.Decimal', value: '12.50' },
      Ratio: { type: 'Edm.Double', value: 2.5 },
      NotANumber: { type: 'Edm.Double', value: 'NaN' },
      Infinite: { type: 'Edm.Single', value: 'INF' },
      Long: { type: 'Edm.Int64', value: '9223372036854775807' },
      Single: { type: 'Edm.Single', value: 1.5 },
      Active: { type: 'Edm.Boolean', value: true },
      At: { type: 'Edm.DateTime', value: '2026-08-21T12:00:00' },
      OffsetAt: { type: 'Edm.DateTimeOffset', value: '2026-08-21T12:00:00+02:00' },
      Elapsed: { type: 'Edm.Time', value: 'PT12H30M' },
      Payload: { type: 'Edm.Binary', value: '01aF' },
      Optional: { type: 'Edm.String', value: null },
    })).toEqual({
      ID: 'guid\'01234567-89ab-cdef-0123-456789abcdef\'',
      Reason: '\'A/B\'\'s desk\'',
      Count: '2',
      Amount: '12.50M',
      Ratio: '2.5D',
      NotANumber: 'NaN',
      Infinite: 'INF',
      Long: '9223372036854775807L',
      Single: '1.5F',
      Active: 'true',
      At: 'datetime\'2026-08-21T12:00:00\'',
      OffsetAt: 'datetimeoffset\'2026-08-21T12:00:00+02:00\'',
      Elapsed: 'time\'PT12H30M\'',
      Payload: 'X\'01aF\'',
    })
  })

  it('rejects unsafe or unsupported OData V2 FunctionImport parameters', () => {
    expect(() => formatODataV2FunctionImportParameters({
      '../ID': { type: 'Edm.Int32', value: 1 },
    })).toThrow('valid identifier')
    expect(() => formatODataV2FunctionImportParameters({
      ID: { type: 'Edm.Guid', value: 'not-a-guid' },
    })).toThrow('invalid value')
    expect(() => formatODataV2FunctionImportParameters({
      At: { type: 'Catalog.Complex', value: 'unsupported' },
    })).toThrow('Unsupported OData V2 FunctionImport')
    expect(() => formatODataV2FunctionImportParameters({
      Amount: { type: 'Edm.Decimal', value: '1e2' },
    })).toThrow('invalid value')
    expect(() => formatODataV2FunctionImportParameters({
      Count: { type: 'Edm.Int16', value: 32768 },
    })).toThrow('invalid value')
    expect(() => formatODataV2FunctionImportParameters({
      At: { type: 'Edm.DateTime', value: '2026-02-30T12:00:00' },
    })).toThrow('invalid value')
    expect(() => formatODataV2FunctionImportParameters({
      At: { type: 'Edm.DateTimeOffset', value: '2026-08-21T12:00:00+15:00' },
    })).toThrow('invalid value')
    expect(() => formatODataV2FunctionImportParameters({
      Elapsed: { type: 'Edm.Time', value: 'PT24H' },
    })).toThrow('invalid value')
    expect(() => formatODataV2FunctionImportParameters({
      Payload: { type: 'Edm.Binary', value: '' },
    })).toThrow('invalid value')
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
  it('creates default and named media-stream paths without accepting path input', () => {
    expect(createODataMediaPath('Documents', { ID: 'A/B' }))
      .toBe('Documents(ID=\'A%2FB\')/$value')
    expect(createODataMediaPath('Documents', 1, 'Preview'))
      .toBe('Documents(1)/Preview/$value')
    expect(() => createODataMediaPath('Documents', 1, '../Preview'))
      .toThrow('valid identifier')
  })
  it('creates exact contained media-stream paths from structured sources', () => {
    expect(createODataMediaPath('Products', {
      kind: 'contained-entity',
      rootKey: { ID: 1, IsActiveEntity: false },
      path: [
        { navigationPath: ['Items'], key: { ItemID: 'A/B' } },
        { navigationPath: ['Attachments'], key: 3 },
      ],
    }, 'Content')).toBe(
      'Products(ID=1,IsActiveEntity=false)/Items(ItemID=\'A%2FB\')/Attachments(3)/Content/$value',
    )
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
  it('creates exact navigation collection root references', () => {
    expect(createODataNavigationRootReference(
      'Products',
      { ID: 'A/B', IsActiveEntity: false },
      ['Items', 'Children'],
    )).toBe(
      '$root/Products(ID=\'A%2FB\',IsActiveEntity=false)/Items/Children',
    )
    expect(() => createODataNavigationRootReference(
      'Products',
      1,
      ['../Items'],
    )).toThrow('valid identifier')
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
