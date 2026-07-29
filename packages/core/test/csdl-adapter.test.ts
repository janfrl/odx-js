import type { CsdlDocument } from '@me-tools/odx-metadata'
import { readFileSync } from 'node:fs'
import { parseCsdl } from '@me-tools/odx-metadata'
import { describe, expect, it } from 'vitest'
import {
  detectODataVersionFromCsdlDocument,
  extractAssociationsFromCsdlDocument,
  extractEntitiesFromCsdlDocument,
} from '../src/csdl-adapter'
import {
  detectODataVersionFromContent,
  extractAssociationsFromEdmxContent,
  extractEntitiesFromEdmxContent,
} from '../src/server'

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
  it.each(['v2', 'v4'] as const)(
    'matches the established entity projection for the %s corpus',
    (version) => {
      const xml = fixture(version)
      expect(extractEntitiesFromCsdlDocument(parse(xml)))
        .toEqual(extractEntitiesFromEdmxContent(xml))
    },
  )

  it('matches established V2 association projection', () => {
    const xml = fixture('v2')
    expect(extractAssociationsFromCsdlDocument(parse(xml)))
      .toEqual(extractAssociationsFromEdmxContent(xml))
  })

  it.each(['v2', 'v4'] as const)(
    'matches established %s version detection',
    (version) => {
      const xml = fixture(version)
      expect(detectODataVersionFromCsdlDocument(parse(xml)))
        .toBe(detectODataVersionFromContent(xml))
    },
  )

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
