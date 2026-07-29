import type { CsdlDocument, CsdlXmlElement } from '@me-tools/odx-metadata'
import type {
  Association,
  AssociationEnd,
  EntityMapping,
  EntityProperty,
  NavigationProperty,
} from './types'
import {
  getXmlAttribute,
  getXmlChildren,
  walkCsdlNodes,
} from '@me-tools/odx-metadata'

interface EntityTypeProjection {
  properties: EntityProperty[]
  navigationProperties: NavigationProperty[]
}

function indexXmlElements(document: CsdlDocument): ReadonlyMap<string, CsdlXmlElement> {
  return new Map(
    walkCsdlNodes(document)
      .filter((node): node is CsdlXmlElement => node.kind === 'element')
      .map(node => [node.id, node]),
  )
}

function registerLocalType(
  localTypes: Map<string, EntityTypeProjection | undefined>,
  name: string,
  projection: EntityTypeProjection,
): void {
  if (localTypes.has(name))
    localTypes.set(name, undefined)
  else
    localTypes.set(name, projection)
}

/** Maps the loss-aware CSDL version to the established core version contract. */
export function detectODataVersionFromCsdlDocument(
  document: CsdlDocument,
): 'v2' | 'v4' | null {
  if (document.odataVersion === '2.0')
    return 'v2'
  if (document.odataVersion === '4.0' || document.odataVersion === '4.01')
    return 'v4'
  return null
}

/**
 * Projects one parsed XML CSDL document into the established entity-mapping
 * contract. This adapter is deliberately separate from loss-aware ingestion:
 * the CSDL document remains the source of truth and this view is disposable.
 */
export function extractEntitiesFromCsdlDocument(
  document: CsdlDocument,
): EntityMapping[] {
  if (document.format !== 'xml')
    return []

  const elements = indexXmlElements(document)
  const qualifiedTypes = new Map<string, EntityTypeProjection>()
  const localTypes = new Map<string, EntityTypeProjection | undefined>()

  for (const schema of document.schemas) {
    for (const member of schema.members) {
      if (member.kind !== 'EntityType' || member.name === undefined)
        continue
      const entityType = elements.get(member.nodeId)
      if (entityType === undefined)
        continue

      const keyNames = new Set(
        getXmlChildren(entityType, 'Key')
          .flatMap(key => getXmlChildren(key, 'PropertyRef'))
          .map(reference => getXmlAttribute(reference, 'Name'))
          .filter((name): name is string => name !== undefined),
      )
      const properties = getXmlChildren(entityType, 'Property')
        .flatMap((property): EntityProperty[] => {
          const name = getXmlAttribute(property, 'Name')
          const type = getXmlAttribute(property, 'Type')
          return name === undefined || type === undefined
            ? []
            : [{ name, type, isKey: keyNames.has(name) }]
        })
      const navigationProperties = getXmlChildren(entityType, 'NavigationProperty')
        .flatMap((navigation): NavigationProperty[] => {
          const name = getXmlAttribute(navigation, 'Name')
          if (name === undefined)
            return []
          return [{
            name,
            relationship: getXmlAttribute(navigation, 'Relationship')
              ?? getXmlAttribute(navigation, 'Type')
              ?? '',
            fromRole: getXmlAttribute(navigation, 'FromRole') ?? '',
            toRole: getXmlAttribute(navigation, 'ToRole') ?? '',
          }]
        })
      const projection = { properties, navigationProperties }
      qualifiedTypes.set(`${schema.namespace}.${member.name}`, projection)
      if (schema.alias !== undefined)
        qualifiedTypes.set(`${schema.alias}.${member.name}`, projection)
      registerLocalType(localTypes, member.name, projection)
    }
  }

  const mappings: EntityMapping[] = []
  for (const schema of document.schemas) {
    for (const member of schema.members) {
      if (member.kind !== 'EntityContainer')
        continue
      const container = elements.get(member.nodeId)
      if (container === undefined)
        continue
      for (const entitySet of getXmlChildren(container, 'EntitySet')) {
        const name = getXmlAttribute(entitySet, 'Name')
        const qualifiedType = getXmlAttribute(entitySet, 'EntityType')
        if (name === undefined || qualifiedType === undefined)
          continue
        const localType = qualifiedType.split('.').at(-1) ?? qualifiedType
        const projection = qualifiedTypes.get(qualifiedType)
          ?? localTypes.get(localType)
          ?? { properties: [], navigationProperties: [] }
        mappings.push({
          name,
          type: localType,
          properties: projection.properties,
          navigationProperties: projection.navigationProperties,
        })
      }
    }
  }
  return mappings
}

/** Projects V2 association declarations from a parsed XML CSDL document. */
export function extractAssociationsFromCsdlDocument(
  document: CsdlDocument,
): Association[] {
  if (document.format !== 'xml')
    return []

  const elements = indexXmlElements(document)
  const associations: Association[] = []
  for (const schema of document.schemas) {
    for (const member of schema.members) {
      if (member.kind !== 'Association' || member.name === undefined)
        continue
      const association = elements.get(member.nodeId)
      if (association === undefined)
        continue
      const ends = getXmlChildren(association, 'End')
        .flatMap((end): AssociationEnd[] => {
          const type = getXmlAttribute(end, 'Type')
          const role = getXmlAttribute(end, 'Role')
          const multiplicity = getXmlAttribute(end, 'Multiplicity')
          return type === undefined || role === undefined || multiplicity === undefined
            ? []
            : [{ type, role, multiplicity }]
        })
      associations.push({ name: member.name, ends })
    }
  }
  return associations
}
