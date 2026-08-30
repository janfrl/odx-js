import type { ODataKey, ODataTypedKeyPart } from '../src/types'
import { describe, expect, it } from 'vitest'
import { createODataEntityPath, createODataNavigationSourcePath, createODataTypedKey, formatODataKey } from '../src/odata-path'

describe('explicitly typed OData entity keys', () => {
  it.each(['v2', 'v4'] as const)('preserves exact numeric keys and string identity in %s', (version) => {
    const decimal = '9007199254740993.12345678901234567890'
    const suffix = version === 'v2' ? 'M' : ''
    const key = createODataTypedKey([{ field: 'ID', type: 'Edm.Decimal', value: decimal }], version)
    expect(createODataEntityPath('Balances', key)).toBe(`Balances(${decimal}${suffix})`)
    expect(formatODataKey(createODataTypedKey([
      { field: 'ID', type: 'Edm.Int64', value: '9223372036854775807' },
      { field: 'Tenant', type: 'Edm.String', value: 'A/B\'s tenant' },
    ], version))).toBe(`ID=9223372036854775807${version === 'v2' ? 'L' : ''},Tenant='A%2FB''s%20tenant'`)
    expect(formatODataKey(decimal)).toBe(`'${decimal}'`)
    expect(Object.isFrozen(key)).toBe(true)
    expect(Object.isFrozen(key['@odata.key'])).toBe(true)
    expect(Object.isFrozen(key['@odata.key'][0])).toBe(true)
    expect(formatODataKey(JSON.parse(JSON.stringify(key)) as ODataKey)).toBe(`${decimal}${suffix}`)
  })

  it('retains typed identity through nested navigation sources', () => {
    const key = createODataTypedKey([{ field: 'ID', type: 'Edm.Int64', value: '9007199254740993' }], 'v4')
    expect(createODataNavigationSourcePath('Orders', {
      kind: 'contained-entity',
      rootKey: key,
      path: [{ navigationPath: ['Items'], key: createODataTypedKey([
        { field: 'Position', type: 'Edm.Decimal', value: '12.500' },
      ], 'v4') }],
    })).toBe('Orders(9007199254740993)/Items(12.500)')
  })

  it.each([
    { field: '../ID', type: 'Edm.String', value: 'x' },
    { field: 'ID', type: 'Edm.Decimal', value: '1)/Other' },
    { field: 'ID', type: 'Edm.Int64', value: '1.5' },
    { field: 'ID', type: 'Edm.Int64', value: '9223372036854775808' },
    { field: 'ID', type: 'Edm.Int64', value: 9007199254740992 },
    { field: 'ID', type: 'Edm.Int32', value: 2147483648 },
    { field: 'ID', type: 'Edm.Decimal', value: true },
    { field: 'ID', type: 'Edm.Double', value: Number.NaN },
    { field: 'ID', type: 'Demo.Unknown', value: 'x' },
  ] satisfies ODataTypedKeyPart[])('rejects invalid typed identity $type / $value', (part) => {
    for (const version of ['v2', 'v4'] as const)
      expect(() => createODataTypedKey([part], version)).toThrow()
  })

  it('rejects empty, duplicate, null, and forged version envelopes', () => {
    const part = { field: 'ID', type: 'Edm.String', value: 'x' }
    expect(() => createODataTypedKey([], 'v4')).toThrow()
    expect(() => createODataTypedKey([part, part], 'v4')).toThrow('duplicated')
    for (const key of [
      { '@odata.key': [part], 'version': 'v3' },
      { '@odata.key': [null], 'version': 'v4' },
      { '@odata.key': [{ ...part, value: null }], 'version': 'v4' },
      { '@odata.key': 'raw(1)', 'version': 'v4' },
    ]) {
      expect(() => formatODataKey(key as unknown as ODataKey)).toThrow()
    }
  })
})
