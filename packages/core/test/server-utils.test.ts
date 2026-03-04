import fs from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import { detectODataVersion, extractEntitiesFromEdmx } from '../src/server'

vi.mock('node:fs')

describe('server Utils (EDMX Parsing)', () => {
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
    expect(entities[0]).toEqual({ name: 'Products', type: 'Product', properties: [], navigationProperties: [] })
    expect(entities[1]).toEqual({ name: 'Suppliers', type: 'Supplier', properties: [], navigationProperties: [] })
  })

  it('correctly distinguishes between Property and NavigationProperty', () => {
    const mockEdmx = `
      <EntityType Name="Category">
        <Key><PropertyRef Name="ID" /></Key>
        <Property Name="ID" Type="Edm.String" />
        <Property Name="Name" Type="Edm.String" />
        <NavigationProperty Name="Products" Type="Collection(V4Service.Product)" />
      </EntityType>
      <EntityContainer Name="Container">
        <EntitySet Name="Categories" EntityType="V4Service.Category" />
      </EntityContainer>
    `
    vi.mocked(fs.existsSync).mockReturnValue(true)
    vi.mocked(fs.readFileSync).mockReturnValue(mockEdmx)

    const entities = extractEntitiesFromEdmx('test.edmx')
    expect(entities).toHaveLength(1)
    const category = entities[0]
    expect(category.name).toBe('Categories')
    expect(category.properties).toHaveLength(2)
    expect(category.properties.map(p => p.name)).toEqual(['ID', 'Name'])
    expect(category.navigationProperties).toHaveLength(1)
    expect(category.navigationProperties[0].name).toBe('Products')
  })

  it('returns empty array if file does not exist', () => {
    vi.mocked(fs.existsSync).mockReturnValue(false)
    expect(extractEntitiesFromEdmx('fake.edmx')).toEqual([])
    expect(detectODataVersion('fake.edmx')).toBeNull()
  })
})
