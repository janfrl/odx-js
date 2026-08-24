import type { CsdlDocument } from '@me-tools/odx-metadata'
import { readFileSync } from 'node:fs'
import { parseCsdl } from '@me-tools/odx-metadata'
import { describe, expect, it } from 'vitest'
import {
  detectODataVersionFromCsdlDocument,
  extractAssociationsFromCsdlDocument,
  extractEntitiesFromCsdlDocument,
} from '../src/csdl-adapter'

function fixture(name: 'v2' | 'v4'): string {
  return readFileSync(new URL(`../../../playground/edmx/${name}.edmx`, import.meta.url), 'utf8')
}

function parse(xml: string): CsdlDocument {
  const result = parseCsdl(xml, { format: 'xml' })
  expect(result.document, result.diagnostics.map(item => item.message).join('\n'))
    .not
    .toBeNull()
  return result.document!
}

describe('cSDL compatibility projection', () => {
  it('projects the fixed V2 corpus without a parallel XML parser', () => {
    const document = parse(fixture('v2'))

    expect(detectODataVersionFromCsdlDocument(document)).toBe('v2')
    expect(extractEntitiesFromCsdlDocument(document)).toEqual([
      {
        name: 'Products',
        type: 'Product',
        properties: [
          { name: 'ID', type: 'Edm.String', isKey: true },
          { name: 'Name', type: 'Edm.String', isKey: false },
          { name: 'Price', type: 'Edm.Decimal', isKey: false },
          { name: 'Currency', type: 'Edm.String', isKey: false },
          { name: 'SupplierID', type: 'Edm.String', isKey: false },
          { name: 'CategoryID', type: 'Edm.String', isKey: false },
        ],
        navigationProperties: [
          {
            name: 'Supplier',
            relationship: 'DummyService.Product_Supplier_ManyToOne',
            fromRole: 'Product',
            toRole: 'Supplier',
          },
          {
            name: 'Category',
            relationship: 'DummyService.Product_Category_ManyToOne',
            fromRole: 'Product',
            toRole: 'Category',
          },
        ],
      },
      {
        name: 'Suppliers',
        type: 'Supplier',
        properties: [
          { name: 'ID', type: 'Edm.String', isKey: true },
          { name: 'Name', type: 'Edm.String', isKey: false },
          { name: 'City', type: 'Edm.String', isKey: false },
        ],
        navigationProperties: [{
          name: 'Products',
          relationship: 'DummyService.Product_Supplier_ManyToOne',
          fromRole: 'Supplier',
          toRole: 'Product',
        }],
      },
      {
        name: 'Categories',
        type: 'Category',
        properties: [
          { name: 'ID', type: 'Edm.String', isKey: true },
          { name: 'Name', type: 'Edm.String', isKey: false },
        ],
        navigationProperties: [{
          name: 'Products',
          relationship: 'DummyService.Product_Category_ManyToOne',
          fromRole: 'Category',
          toRole: 'Product',
        }],
      },
    ])
    expect(extractAssociationsFromCsdlDocument(document)).toEqual([
      {
        name: 'Product_Supplier_ManyToOne',
        ends: [
          { type: 'DummyService.Product', role: 'Product', multiplicity: '*' },
          { type: 'DummyService.Supplier', role: 'Supplier', multiplicity: '1' },
        ],
      },
      {
        name: 'Product_Category_ManyToOne',
        ends: [
          { type: 'DummyService.Product', role: 'Product', multiplicity: '*' },
          { type: 'DummyService.Category', role: 'Category', multiplicity: '1' },
        ],
      },
    ])
  })

  it('projects the fixed V4 corpus without V2 associations', () => {
    const document = parse(fixture('v4'))

    expect(detectODataVersionFromCsdlDocument(document)).toBe('v4')
    expect(extractEntitiesFromCsdlDocument(document)).toEqual([
      {
        name: 'Products',
        type: 'Product',
        properties: [
          { name: 'ID', type: 'Edm.String', isKey: true },
          { name: 'Name', type: 'Edm.String', isKey: false },
          { name: 'Price', type: 'Edm.Decimal', isKey: false },
          { name: 'Category_ID', type: 'Edm.String', isKey: false },
        ],
        navigationProperties: [{
          name: 'Category',
          relationship: 'V4Service.Category',
          fromRole: '',
          toRole: '',
        }],
      },
      {
        name: 'Categories',
        type: 'Category',
        properties: [
          { name: 'ID', type: 'Edm.String', isKey: true },
          { name: 'Name', type: 'Edm.String', isKey: false },
        ],
        navigationProperties: [{
          name: 'Products',
          relationship: 'Collection(V4Service.Product)',
          fromRole: '',
          toRole: '',
        }],
      },
    ])
    expect(extractAssociationsFromCsdlDocument(document)).toEqual([])
  })

  it('resolves qualified and aliased entity types without local-name collisions', () => {
    const document = parse(`
      <edmx:Edmx xmlns:edmx="http://docs.oasis-open.org/odata/ns/edmx" Version="4.0">
        <edmx:DataServices>
          <Schema xmlns="http://docs.oasis-open.org/odata/ns/edm" Namespace="First" Alias="F">
            <EntityType Name="Item"><Key><PropertyRef Name="FirstID" /></Key><Property Name="FirstID" Type="Edm.Int32" /></EntityType>
            <EntityContainer Name="Container"><EntitySet Name="FirstItems" EntityType="F.Item" /></EntityContainer>
          </Schema>
          <Schema xmlns="http://docs.oasis-open.org/odata/ns/edm" Namespace="Second">
            <EntityType Name="Item"><Key><PropertyRef Name="SecondID" /></Key><Property Name="SecondID" Type="Edm.String" /></EntityType>
            <EntityContainer Name="Container"><EntitySet Name="SecondItems" EntityType="Second.Item" /></EntityContainer>
          </Schema>
        </edmx:DataServices>
      </edmx:Edmx>
    `)

    expect(extractEntitiesFromCsdlDocument(document)).toEqual([
      {
        name: 'FirstItems',
        type: 'Item',
        properties: [{ name: 'FirstID', type: 'Edm.Int32', isKey: true }],
        navigationProperties: [],
      },
      {
        name: 'SecondItems',
        type: 'Item',
        properties: [{ name: 'SecondID', type: 'Edm.String', isKey: true }],
        navigationProperties: [],
      },
    ])
  })
  it('does not fabricate a known version or XML projection', () => {
    const result = parseCsdl({ $Version: '5.0', Example: {} }, { format: 'json' })
    expect(result.document).not.toBeNull()
    expect(detectODataVersionFromCsdlDocument(result.document!)).toBeNull()
    expect(extractEntitiesFromCsdlDocument(result.document!)).toEqual([])
    expect(extractAssociationsFromCsdlDocument(result.document!)).toEqual([])
  })
})
