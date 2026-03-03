import fs from 'node:fs'
import { join } from 'pathe'
import { describe, expect, it } from 'vitest'
import { extractAssociationsFromEdmx, extractEntitiesFromEdmx } from '../src/server'

// Helper to create a temp file for testing
function createTempEdmx(content: string) {
  const path = join(process.cwd(), 'temp_test.edmx')
  fs.writeFileSync(path, content)
  return path
}

describe('eDMX Parser', () => {
  it('parses OData V2 correctly (properties, keys, associations)', () => {
    const v2xml = `
      <edmx:Edmx Version="1.0" xmlns:edmx="http://schemas.microsoft.com/ado/2007/06/edmx">
        <edmx:DataServices m:DataServiceVersion="2.0" xmlns:m="http://schemas.microsoft.com/ado/2007/08/dataservices/metadata">
          <Schema Namespace="NorthwindModel" xmlns="http://schemas.microsoft.com/ado/2008/09/edm">
            <EntityType Name="Product">
              <Key>
                <PropertyRef Name="ProductID" />
              </Key>
              <Property Name="ProductID" Type="Edm.Int32" Nullable="false" />
              <Property Type="Edm.String" Name="ProductName" MaxLength="40" />
              <NavigationProperty Name="Category" Relationship="NorthwindModel.FK_Products_Categories" FromRole="Products" ToRole="Categories" />
            </EntityType>
            <Association Name="FK_Products_Categories">
              <End Role="Products" Type="NorthwindModel.Product" Multiplicity="*" />
              <End Role="Categories" Type="NorthwindModel.Category" Multiplicity="0..1" />
            </Association>
            <EntityContainer Name="NorthwindEntities" m:IsDefaultEntityContainer="true">
              <EntitySet Name="Products" EntityType="NorthwindModel.Product" />
            </EntityContainer>
          </Schema>
        </edmx:DataServices>
      </edmx:Edmx>
    `
    const path = createTempEdmx(v2xml)
    const entities = extractEntitiesFromEdmx(path)
    const assocs = extractAssociationsFromEdmx(path)
    fs.unlinkSync(path)

    expect(entities).toHaveLength(1)
    const product = entities[0]
    expect(product.name).toBe('Products')

    // Check Keys
    const idProp = product.properties.find(p => p.name === 'ProductID')
    expect(idProp?.isKey).toBe(true)

    // Check attribute order independence (Type before Name)
    const nameProp = product.properties.find(p => p.name === 'ProductName')
    expect(nameProp).toBeDefined()
    expect(nameProp?.type).toBe('Edm.String')

    // Check Associations
    expect(assocs).toHaveLength(1)
    expect(assocs[0].name).toBe('FK_Products_Categories')
    expect(assocs[0].ends).toHaveLength(2)
  })

  it('parses OData V4 correctly (direct navigation properties)', () => {
    const v4xml = `
      <edmx:Edmx Version="4.0" xmlns:edmx="http://docs.oasis-open.org/odata/ns/edmx">
        <edmx:DataServices>
          <Schema Namespace="Test" xmlns="http://docs.oasis-open.org/odata/ns/edm">
            <EntityType Name="Customer">
              <Key>
                <PropertyRef Name="ID" />
              </Key>
              <Property Name="ID" Type="Edm.String" Nullable="false" />
              <NavigationProperty Name="Orders" Type="Collection(Test.Order)" />
            </EntityType>
            <EntityContainer Name="Container">
              <EntitySet Name="Customers" EntityType="Test.Customer" />
            </EntityContainer>
          </Schema>
        </edmx:DataServices>
      </edmx:Edmx>
    `
    const path = createTempEdmx(v4xml)
    const entities = extractEntitiesFromEdmx(path)
    fs.unlinkSync(path)

    expect(entities).toHaveLength(1)
    const customer = entities[0]
    expect(customer.properties[0].isKey).toBe(true)

    // V4 Navigation
    expect(customer.navigationProperties).toHaveLength(1)
    expect(customer.navigationProperties[0].name).toBe('Orders')
    // In V4 relationship might be implicit or mapped from Type
    expect(customer.navigationProperties[0].relationship).toBe('Collection(Test.Order)')
  })
})
