import type {
  CsdlDocument,
  CsdlJsonObject,
  CsdlJsonPrimitive,
  CsdlParseResult,
  CsdlXmlElement,
} from '../src'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  canonicalizeCsdlDocument,
  createCsdlArtifact,
  getJsonProperties,
  getJsonProperty,
  getXmlAttribute,
  getXmlChildren,
  hashCsdlSource,
  parseCsdl,
  parseCsdlJson,
  parseCsdlXml,
  resolveCsdlNullable,
  serializeCsdlDocument,
  walkCsdlNodes,
} from '../src'

function fixture(name: string): string {
  return readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8')
}

function requireDocument(result: CsdlParseResult): CsdlDocument {
  expect(result.document, result.diagnostics.map(item => item.message).join('\n')).not.toBeNull()
  return result.document!
}

function diagnosticCodes(result: CsdlParseResult): string[] {
  return result.diagnostics.map(item => item.code)
}

function xmlElement(document: CsdlDocument, localName: string): CsdlXmlElement {
  const node = walkCsdlNodes(document).find(candidate => candidate.kind === 'element' && candidate.name.local === localName)
  expect(node).toBeDefined()
  return node as CsdlXmlElement
}

function jsonObjectProperty(object: CsdlJsonObject, name: string): CsdlJsonObject {
  const value = getJsonProperty(object, name)
  expect(value?.kind).toBe('object')
  return value as CsdlJsonObject
}

describe('xML CSDL ingestion', () => {
  it('preserves V4.01 namespaces, extensions, order, locations, and overloads', () => {
    const source = fixture('v4.01.xml')
    const result = parseCsdlXml(source, { source: { id: 'catalog-v4' } })
    const document = requireDocument(result)

    expect(document.format).toBe('xml')
    expect(document.odataVersion).toBe('4.01')
    expect(document.source.id).toBe('catalog-v4')
    expect(document.schemas).toEqual([
      expect.objectContaining({
        namespace: 'Catalog',
        alias: 'C',
        members: expect.arrayContaining([
          expect.objectContaining({ kind: 'EntityType', name: 'Book' }),
          expect.objectContaining({ kind: 'Function', name: 'Find', overloadIndex: 0 }),
          expect.objectContaining({ kind: 'Function', name: 'Find', overloadIndex: 1 }),
        ]),
      }),
    ])

    const schema = xmlElement(document, 'Schema')
    expect(schema.name.prefix).toBe('cs')
    expect(schema.name.namespace).toBe('http://docs.oasis-open.org/odata/ns/edm')
    expect(getXmlAttribute(schema, 'Namespace')).toBe('Catalog')
    expect(schema.attributes.find(item => item.name.local === 'mode')).toMatchObject({
      value: 'kept',
      name: { prefix: 'ext', namespace: 'urn:example:extension' },
    })
    expect(getXmlChildren(schema).map(item => item.name.local)).toEqual(['EntityType', 'Function', 'Function'])

    const entity = xmlElement(document, 'EntityType')
    expect(getXmlChildren(entity).map(item => item.name.local)).toEqual(['Key', 'Property', 'SearchHint', 'Annotation'])
    const extension = getXmlChildren(entity, 'SearchHint')[0]!
    expect(extension.name.namespace).toBe('urn:example:extension')
    expect(extension.provenance.range?.start.line).toBeGreaterThan(1)
    expect(extension.id).toContain('SearchHint')
    expect(result.diagnostics).toEqual([])
    expect(() => JSON.stringify(document)).not.toThrow()
  })

  it('keeps V2 associations, roles, function imports, and SAP extensions without converting them', () => {
    const result = parseCsdlXml(fixture('v2.xml'))
    const document = requireDocument(result)

    expect(document.odataVersion).toBe('2.0')
    expect(document.schemas[0]).toMatchObject({
      namespace: 'Legacy',
      members: expect.arrayContaining([
        expect.objectContaining({ kind: 'Association', name: 'ProductCategory' }),
        expect.objectContaining({ kind: 'EntityContainer', name: 'LegacyService' }),
      ]),
    })

    const schema = xmlElement(document, 'Schema')
    expect(schema.attributes.find(item => item.name.local === 'schema-version')).toMatchObject({
      value: '1',
      name: { namespace: 'http://www.sap.com/Protocols/SAPData' },
    })
    const association = xmlElement(document, 'Association')
    expect(getXmlChildren(association, 'End').map(end => [getXmlAttribute(end, 'Role'), getXmlAttribute(end, 'Multiplicity')])).toEqual([
      ['Product', '*'],
      ['Category', '1'],
    ])
    expect(xmlElement(document, 'AssociationSet')).toBeDefined()
    expect(xmlElement(document, 'FunctionImport').attributes.find(item => item.name.local === 'HttpMethod')).toMatchObject({ value: 'POST' })
    expect(result.diagnostics).toEqual([])
  })

  it('does not treat declaration-like text inside comments as an active DTD', () => {
    const result = parseCsdlXml('<Schema Namespace="N"><!-- <!DOCTYPE harmless> --></Schema>')
    const document = requireDocument(result)
    expect(document.odataVersion).toBe('unknown')
    expect(diagnosticCodes(result)).not.toContain('ODX_METADATA_XML_DTD_FORBIDDEN')
  })
  it('diagnoses unknown versions instead of assuming V2 or V4', () => {
    const result = parseCsdlXml('<Edmx Version="9.0"><DataServices DataServiceVersion="2.0"><Schema Namespace="N" /></DataServices></Edmx>')
    expect(requireDocument(result).odataVersion).toBe('unknown')
    expect(diagnosticCodes(result)).toContain('ODX_METADATA_VERSION_UNKNOWN')
  })
})

describe('jSON CSDL ingestion', () => {
  it('preserves duplicate properties, exact large-number lexemes, annotations, and locations', () => {
    const result = parseCsdlJson(fixture('v4.01.json.txt'), { source: { uri: 'memory:catalog.json' } })
    const document = requireDocument(result)
    const root = document.root as CsdlJsonObject
    const catalog = jsonObjectProperty(root, 'Catalog')
    const book = jsonObjectProperty(catalog, 'Book')

    expect(document.odataVersion).toBe('4.01')
    expect(document.source).toMatchObject({ id: 'memory:catalog.json', uri: 'memory:catalog.json' })
    expect(document.schemas[0]?.members).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'Function', name: 'Find', overloadIndex: 0 }),
      expect.objectContaining({ kind: 'Function', name: 'Find', overloadIndex: 1 }),
    ]))
    expect(getJsonProperties(book, 'Name')).toHaveLength(2)
    expect(getJsonProperties(book, 'Name')[1]!.id).toContain('Name~1')

    const large = getJsonProperty(book, 'LargeExample') as CsdlJsonPrimitive
    expect(large.kind).toBe('number')
    expect(large.rawValue).toBe('9223372036854775807')
    expect(large.provenance.range?.start.line).toBeGreaterThan(1)
    expect(getJsonProperty(book, '@UI.HeaderInfo')).toBeDefined()
    expect(diagnosticCodes(result)).toEqual(expect.arrayContaining([
      'ODX_METADATA_JSON_DUPLICATE_PROPERTY',
      'ODX_METADATA_JSON_NUMBER_APPROXIMATED',
    ]))
    expect(() => JSON.stringify(document)).not.toThrow()
  })

  it('makes the provenance loss of object input explicit', () => {
    const result = parseCsdlJson({
      $Version: '4.01',
      Catalog: { Book: { $Kind: 'EntityType' } },
    })
    const document = requireDocument(result)

    expect(diagnosticCodes(result)).toContain('ODX_METADATA_JSON_SOURCE_LOCATIONS_UNAVAILABLE')
    expect(document.root.provenance.range).toBeUndefined()
  })

  it('diagnoses an unknown explicit JSON version', () => {
    const result = parseCsdlJson('{"$Version":"5.0","N":{}}')
    expect(requireDocument(result).odataVersion).toBe('unknown')
    expect(diagnosticCodes(result)).toContain('ODX_METADATA_VERSION_UNKNOWN')
  })
})

describe('facet semantics', () => {
  it('retains the encoding-specific Nullable defaults and explicit values', () => {
    const xmlDefault = requireDocument(parseCsdlXml('<Schema xmlns:ext="urn:ext" Namespace="N"><Property Name="A" Type="Edm.String" ext:Nullable="false" /></Schema>'))
    const xmlExplicit = requireDocument(parseCsdlXml('<Schema Namespace="N"><Property Name="A" Type="Edm.String" Nullable="false" /></Schema>'))
    expect(resolveCsdlNullable(xmlDefault, xmlElement(xmlDefault, 'Property'))).toEqual({ value: true, source: 'default' })
    expect(resolveCsdlNullable(xmlExplicit, xmlElement(xmlExplicit, 'Property'))).toEqual({ value: false, source: 'explicit' })

    const jsonDefault = requireDocument(parseCsdlJson('{"$Version":"4.01","N":{"A":{"$Kind":"EntityType"}}}'))
    const jsonExplicit = requireDocument(parseCsdlJson('{"$Version":"4.01","N":{"A":{"$Kind":"EntityType","$Nullable":true}}}'))
    const defaultNode = jsonObjectProperty(jsonObjectProperty(jsonDefault.root as CsdlJsonObject, 'N'), 'A')
    const explicitNode = jsonObjectProperty(jsonObjectProperty(jsonExplicit.root as CsdlJsonObject, 'N'), 'A')
    expect(resolveCsdlNullable(jsonDefault, defaultNode)).toEqual({ value: false, source: 'default' })
    expect(resolveCsdlNullable(jsonExplicit, explicitNode)).toEqual({ value: true, source: 'explicit' })
  })
})

describe('security and malformed input', () => {
  it.each([
    ['DTD declarations', '<!DOCTYPE x [<!ENTITY e SYSTEM "file:///etc/passwd">]><Schema Namespace="N" />', 'ODX_METADATA_XML_DTD_FORBIDDEN'],
    ['unknown entities', '<Schema Namespace="N" Label="&custom;" />', 'ODX_METADATA_XML_UNKNOWN_ENTITY'],
    ['invalid numeric entities', '<Schema Namespace="N" Label="&#0;" />', 'ODX_METADATA_XML_INVALID_ENTITY'],
    ['surrogate numeric entities', '<Schema Namespace="N" Label="&#xD800;" />', 'ODX_METADATA_XML_INVALID_ENTITY'],
    ['unbound prefixes', '<x:Schema Namespace="N" />', 'ODX_METADATA_XML_UNBOUND_PREFIX'],
    ['duplicate attributes', '<Schema Namespace="N" Namespace="Again" />', 'ODX_METADATA_XML_DUPLICATE_ATTRIBUTE'],
    ['mismatched elements', '<Schema Namespace="N"><EntityType></Schema>', 'ODX_METADATA_XML_MISMATCHED_TAG'],
  ])('rejects %s', (_label, input, code) => {
    const result = parseCsdlXml(input)
    expect(result.document).toBeNull()
    expect(diagnosticCodes(result)).toContain(code)
  })

  it('enforces configured nesting limits for XML and JSON', () => {
    const xml = parseCsdlXml('<Schema Namespace="N"><EntityType Name="A" /></Schema>', { maxDepth: 1 })
    const json = parseCsdlJson('{"$Version":"4.01","N":{}}', { maxDepth: 1 })
    expect(xml.document).toBeNull()
    expect(json.document).toBeNull()
    expect(diagnosticCodes(xml)).toContain('ODX_METADATA_MAX_DEPTH')
    expect(diagnosticCodes(json)).toContain('ODX_METADATA_MAX_DEPTH')
  })

  it('returns stable diagnostics for malformed JSON', () => {
    const result = parseCsdlJson('{"$Version":"4.01",}')
    expect(result.document).toBeNull()
    expect(result.diagnostics[0]).toMatchObject({ severity: 'error' })
    expect(result.diagnostics[0]!.provenance.range?.start.offset).toBeGreaterThan(0)
  })
})

describe('identity, serialization, and hashing', () => {
  it('assigns deterministic IDs and keeps source-order arrays', () => {
    const source = fixture('v4.01.json.txt')
    const first = requireDocument(parseCsdl(source, { format: 'json' }))
    const second = requireDocument(parseCsdl(source, { format: 'json' }))
    expect(walkCsdlNodes(first).map(node => node.id)).toEqual(walkCsdlNodes(second).map(node => node.id))
    expect(serializeCsdlDocument(first)).toBe(serializeCsdlDocument(second))
  })

  it('canonicalizes JSON property and XML attribute order while retaining exact-source hashes', async () => {
    const jsonA = '{"$Version":"4.01","N":{"B":{"$Kind":"EntityType"},"A":{"$Kind":"EntityType"}}}'
    const jsonB = '{ "N": { "A": { "$Kind": "EntityType" }, "B": { "$Kind": "EntityType" } }, "$Version": "4.01" }'
    const documentA = requireDocument(parseCsdlJson(jsonA))
    const documentB = requireDocument(parseCsdlJson(jsonB))
    const artifactA = await createCsdlArtifact(documentA, jsonA)
    const artifactB = await createCsdlArtifact(documentB, jsonB)

    expect(canonicalizeCsdlDocument(documentA)).toBe(canonicalizeCsdlDocument(documentB))
    expect(artifactA.documentHash).toBe(artifactB.documentHash)
    expect(artifactA.sourceHash).not.toBe(artifactB.sourceHash)

    const xmlA = requireDocument(parseCsdlXml('<Schema Namespace="N" Alias="A" />'))
    const xmlB = requireDocument(parseCsdlXml('<Schema Alias="A" Namespace="N" />'))
    expect((await createCsdlArtifact(xmlA)).documentHash).toBe((await createCsdlArtifact(xmlB)).documentHash)
    expect(await hashCsdlSource('ascii')).toBe(await hashCsdlSource(new TextEncoder().encode('ascii')))
  })

  it('excludes raw input and locations unless explicitly serialized', async () => {
    const source = fixture('v4.01.xml')
    const document = requireDocument(parseCsdlXml(source, { includeRawSource: true }))
    const normal = serializeCsdlDocument(document)
    const compact = serializeCsdlDocument(document, { includeLocations: false })
    const lossAware = serializeCsdlDocument(document, { includeRawSource: true })
    const artifact = await createCsdlArtifact(document)

    expect(normal).not.toContain('rawSource')
    expect(normal).toContain('"range"')
    expect(compact).not.toContain('"range"')
    expect(lossAware).toContain('rawSource')
    expect(artifact.sourceHash).toBeDefined()
    expect(artifact.document).not.toContain('rawSource')
    expect(() => JSON.parse(artifact.document)).not.toThrow()
  })
})
