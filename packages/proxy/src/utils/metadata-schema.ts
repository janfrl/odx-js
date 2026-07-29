import type { Association, EntityMapping } from '@me-tools/odx-core'
import type { CsdlDocument, CsdlXmlElement } from '@me-tools/odx-metadata'
import {
  detectODataVersionFromCsdlDocument,
  extractAssociationsFromCsdlDocument,
  extractEntitiesFromCsdlDocument,
} from '@me-tools/odx-core/server'
import { getXmlAttribute, parseCsdl, walkCsdlNodes } from '@me-tools/odx-metadata'

export interface MetadataSchemaProjection {
  version: 'v2' | 'v4' | null
  namespace: string
  entities: EntityMapping[]
  associations: Association[]
  raw: {
    entityTypes: string[]
    associations: string[]
    navigationProperties: string[]
  }
}

function namedMembers(
  document: CsdlDocument,
  memberKind: 'Association' | 'EntityType',
): string[] {
  return document.schemas
    .flatMap(schema => schema.members)
    .flatMap(member => member.kind === memberKind && member.name !== undefined
      ? [member.name]
      : [])
}

function projectMetadataSchema(document: CsdlDocument): MetadataSchemaProjection {
  return {
    version: detectODataVersionFromCsdlDocument(document),
    namespace: document.schemas[0]?.namespace ?? '',
    entities: extractEntitiesFromCsdlDocument(document),
    associations: extractAssociationsFromCsdlDocument(document),
    raw: {
      entityTypes: namedMembers(document, 'EntityType'),
      associations: namedMembers(document, 'Association'),
      navigationProperties: walkCsdlNodes(document)
        .filter((node): node is CsdlXmlElement =>
          node.kind === 'element' && node.name.local === 'NavigationProperty')
        .map(node => getXmlAttribute(node, 'Name'))
        .filter((name): name is string => name !== undefined),
    },
  }
}

export function parseMetadataSchema(xml: string): MetadataSchemaProjection {
  const result = parseCsdl(xml, { format: 'xml' })
  if (result.document !== null)
    return projectMetadataSchema(result.document)

  const reason = result.diagnostics
    .map(diagnostic => diagnostic.message)
    .join('; ')
  throw new TypeError(reason || 'Metadata did not produce a CSDL document.')
}

export function tryParseMetadataSchema(xml: string): MetadataSchemaProjection | null {
  const result = parseCsdl(xml, { format: 'xml' })
  return result.document === null ? null : projectMetadataSchema(result.document)
}
