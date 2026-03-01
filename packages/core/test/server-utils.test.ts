import { describe, expect, it, vi } from 'vitest'
import fs from 'node:fs'
import { extractEntitiesFromEdmx, detectODataVersion } from '../src/server'

vi.mock('node:fs')

describe('Server Utils (EDMX Parsing)', () => {
  it('detects OData V2 vs V4 versions correctly', () => {
    vi.mocked(fs.existsSync).mockReturnValue(true)
    
    vi.mocked(fs.readFileSync).mockReturnValue('<edmx:Edmx Version="1.0" xmlns:edmx="http://schemas.microsoft.com/ado/2007/06/edmx">')
    expect(detectODataVersion('test.edmx')).toBe('v2')

    vi.mocked(fs.readFileSync).mockReturnValue('<edmx:Edmx Version="4.0" xmlns:edmx="http://docs.oasis-open.org/odata/ns/edmx">')
    expect(detectODataVersion('test.edmx')).toBe('v4')
  })

  it('extracts entity sets and strips namespaces', () => {
    const mockEdmx = `
      <EntitySet Name="Products" EntityType="Namespace.Product" />
      <EntitySet Name="Suppliers" EntityType="Supplier" />
    `
    vi.mocked(fs.existsSync).mockReturnValue(true)
    vi.mocked(fs.readFileSync).mockReturnValue(mockEdmx)

    const entities = extractEntitiesFromEdmx('test.edmx')
    expect(entities).toHaveLength(2)
    expect(entities[0]).toEqual({ name: 'Products', type: 'Product' })
    expect(entities[1]).toEqual({ name: 'Suppliers', type: 'Supplier' })
  })

  it('returns empty array if file does not exist', () => {
    vi.mocked(fs.existsSync).mockReturnValue(false)
    expect(extractEntitiesFromEdmx('fake.edmx')).toEqual([])
    expect(detectODataVersion('fake.edmx')).toBeNull()
  })
})
