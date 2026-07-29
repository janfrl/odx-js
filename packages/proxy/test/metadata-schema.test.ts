import { describe, expect, it } from 'vitest'
import { parseMetadataSchema, tryParseMetadataSchema } from '../src/utils/metadata-schema'

const v4 = `
<edmx:Edmx xmlns:edmx="http://docs.oasis-open.org/odata/ns/edmx" Version="4.0">
  <edmx:DataServices>
    <Schema xmlns="http://docs.oasis-open.org/odata/ns/edm" Namespace="Catalog" Alias="C">
      <EntityType Name="Product">
        <Key><PropertyRef Name="ID" /></Key>
        <Property Name="ID" Type="Edm.Int32" />
        <NavigationProperty Name="Reviews" Type="Collection(C.Review)" />
      </EntityType>
      <EntityType Name="Review"><Property Name="ID" Type="Edm.Int32" /></EntityType>
      <EntityContainer Name="Container"><EntitySet Name="Products" EntityType="C.Product" /></EntityContainer>
    </Schema>
  </edmx:DataServices>
</edmx:Edmx>`

const v2 = `
<edmx:Edmx xmlns:edmx="http://schemas.microsoft.com/ado/2007/06/edmx" Version="1.0">
  <edmx:DataServices>
    <Schema xmlns="http://schemas.microsoft.com/ado/2008/09/edm" Namespace="Legacy">
      <EntityType Name="Product"><Key><PropertyRef Name="ID" /></Key><Property Name="ID" Type="Edm.Int32" /></EntityType>
      <Association Name="ProductReviews">
        <End Type="Legacy.Product" Role="Product" Multiplicity="1" />
        <End Type="Legacy.Review" Role="Reviews" Multiplicity="*" />
      </Association>
      <EntityContainer Name="Container"><EntitySet Name="Products" EntityType="Legacy.Product" /></EntityContainer>
    </Schema>
  </edmx:DataServices>
</edmx:Edmx>`

describe('metadata schema projection', () => {
  it('builds Explorer graph data from a V4 CSDL document', () => {
    expect(parseMetadataSchema(v4)).toEqual({
      version: 'v4',
      namespace: 'Catalog',
      entities: [{
        name: 'Products',
        type: 'Product',
        properties: [{ name: 'ID', type: 'Edm.Int32', isKey: true }],
        navigationProperties: [{
          name: 'Reviews',
          relationship: 'Collection(C.Review)',
          fromRole: '',
          toRole: '',
        }],
      }],
      associations: [],
      raw: {
        entityTypes: ['Product', 'Review'],
        associations: [],
        navigationProperties: ['Reviews'],
      },
    })
  })

  it('recognizes V2 envelopes and projects associations', () => {
    const projection = parseMetadataSchema(v2)
    expect(projection.version).toBe('v2')
    expect(projection.associations).toEqual([{
      name: 'ProductReviews',
      ends: [
        { type: 'Legacy.Product', role: 'Product', multiplicity: '1' },
        { type: 'Legacy.Review', role: 'Reviews', multiplicity: '*' },
      ],
    }])
    expect(projection.raw.associations).toEqual(['ProductReviews'])
  })

  it('keeps tolerant config discovery separate from strict schema parsing', () => {
    expect(tryParseMetadataSchema('<edmx:Edmx>')).toBeNull()
    expect(() => parseMetadataSchema('<edmx:Edmx>')).toThrow()
  })
})
