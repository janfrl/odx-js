import type {
  CsdlDocument,
  CsdlJsonNode,
  CsdlJsonObject,
  CsdlJsonProperty,
  CsdlNode,
  CsdlXmlElement,
  CsdlXmlNode,
} from './types'
import { jsonProperty, xmlAttribute } from './internal'

const XML_BOOLEAN_REGEX = /^(?:true|false)$/iu

export interface CsdlResolvedFacet<T> {
  value: T
  source: 'explicit' | 'default'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isOptionalString(value: unknown): boolean {
  return value === undefined || typeof value === 'string'
}

function isPosition(value: unknown): boolean {
  return isRecord(value)
    && typeof value.offset === 'number'
    && typeof value.line === 'number'
    && typeof value.column === 'number'
}

function isProvenance(value: unknown): boolean {
  return isRecord(value)
    && typeof value.sourceId === 'string'
    && typeof value.path === 'string'
    && (value.range === undefined
      || (isRecord(value.range)
        && isPosition(value.range.start)
        && isPosition(value.range.end)))
}

function isQualifiedName(value: unknown): boolean {
  return isRecord(value)
    && typeof value.qualified === 'string'
    && typeof value.local === 'string'
    && isOptionalString(value.prefix)
    && isOptionalString(value.namespace)
}

function isNodeBase(value: Record<string, unknown>): boolean {
  return typeof value.id === 'string' && isProvenance(value.provenance)
}

function isXmlRoot(value: unknown): boolean {
  if (!isRecord(value) || value.kind !== 'element')
    return false
  const pending: unknown[] = [value]
  const seen = new WeakSet<object>()
  while (pending.length > 0) {
    const node = pending.pop()
    if (!isRecord(node) || seen.has(node) || !isNodeBase(node))
      return false
    seen.add(node)
    if (node.kind === 'element') {
      if (!isQualifiedName(node.name)
        || !isRecord(node.namespaces)
        || !Object.values(node.namespaces).every(item => typeof item === 'string')
        || !Array.isArray(node.attributes)
        || !Array.isArray(node.children)) {
        return false
      }
      for (const attribute of node.attributes) {
        if (!isRecord(attribute)
          || !isQualifiedName(attribute.name)
          || typeof attribute.value !== 'string'
          || typeof attribute.rawValue !== 'string'
          || !isProvenance(attribute.provenance)) {
          return false
        }
      }
      pending.push(...node.children)
    }
    else if (node.kind === 'text' || node.kind === 'cdata' || node.kind === 'comment') {
      if (typeof node.value !== 'string')
        return false
    }
    else if (node.kind === 'processing-instruction') {
      if (typeof node.target !== 'string' || typeof node.value !== 'string')
        return false
    }
    else {
      return false
    }
  }
  return true
}

function isJsonRoot(value: unknown): boolean {
  if (!isRecord(value) || value.kind !== 'object')
    return false
  const pending: unknown[] = [value]
  const seen = new WeakSet<object>()
  while (pending.length > 0) {
    const node = pending.pop()
    if (!isRecord(node) || seen.has(node) || !isNodeBase(node))
      return false
    seen.add(node)
    if (node.kind === 'object') {
      if (!Array.isArray(node.properties))
        return false
      for (const property of node.properties) {
        if (!isRecord(property)
          || property.kind !== 'property'
          || !isNodeBase(property)
          || typeof property.name !== 'string') {
          return false
        }
        pending.push(property.value)
      }
    }
    else if (node.kind === 'array') {
      if (!Array.isArray(node.items))
        return false
      pending.push(...node.items)
    }
    else if (node.kind === 'string'
      || node.kind === 'number'
      || node.kind === 'boolean'
      || node.kind === 'null') {
      if (typeof node.rawValue !== 'string')
        return false
      const expectedType = node.kind === 'null' ? 'object' : node.kind
      if (typeof node.value !== expectedType || (node.kind === 'null' && node.value !== null))
        return false
    }
    else {
      return false
    }
  }
  return true
}

/**
 * Checks the complete versioned, JSON-serializable CSDL document boundary.
 * This is intentionally vocabulary-neutral and performs no semantic validation.
 */
export function isCsdlDocument(value: unknown): value is CsdlDocument {
  if (!isRecord(value)
    || value.contractVersion !== 1
    || value.idAlgorithm !== 'odx-csdl-id-v1'
    || (value.format !== 'xml' && value.format !== 'json')
    || !['2.0', '4.0', '4.01', 'unknown'].includes(String(value.odataVersion))
    || !isRecord(value.source)
    || typeof value.source.id !== 'string'
    || value.source.format !== value.format
    || !isOptionalString(value.source.uri)
    || !isOptionalString(value.source.layer)
    || !Array.isArray(value.schemas)
    || !Array.isArray(value.diagnostics)
    || !isOptionalString(value.rawSource)) {
    return false
  }
  if (!value.schemas.every(schema => isRecord(schema)
    && typeof schema.namespace === 'string'
    && isOptionalString(schema.alias)
    && typeof schema.nodeId === 'string'
    && Array.isArray(schema.members)
    && schema.members.every(member => isRecord(member)
      && typeof member.kind === 'string'
      && isOptionalString(member.name)
      && typeof member.nodeId === 'string'
      && (member.overloadIndex === undefined || typeof member.overloadIndex === 'number')))) {
    return false
  }
  if (!value.diagnostics.every(item => isRecord(item)
    && typeof item.code === 'string'
    && ['info', 'warning', 'error'].includes(String(item.severity))
    && typeof item.message === 'string'
    && isProvenance(item.provenance))) {
    return false
  }
  return value.format === 'xml' ? isXmlRoot(value.root) : isJsonRoot(value.root)
}

export function getXmlAttribute(element: CsdlXmlElement, localName: string): string | undefined {
  return xmlAttribute(element, localName)?.value
}

export function getXmlChildren(element: CsdlXmlElement, localName?: string): CsdlXmlElement[] {
  return element.children.filter((child): child is CsdlXmlElement =>
    child.kind === 'element' && (!localName || child.name.local === localName),
  )
}

export function getJsonProperties(object: CsdlJsonObject, name: string): CsdlJsonProperty[] {
  return object.properties.filter(property => property.name === name)
}

export function getJsonProperty(object: CsdlJsonObject, name: string): CsdlJsonNode | undefined {
  return jsonProperty(object, name)?.value
}

export function walkCsdlNodes(document: CsdlDocument): CsdlNode[] {
  const nodes: CsdlNode[] = []

  if (document.format === 'xml') {
    const visit = (node: CsdlXmlNode): void => {
      nodes.push(node)
      if (node.kind === 'element')
        node.children.forEach(visit)
    }
    visit(document.root as CsdlXmlElement)
  }
  else {
    const visit = (node: CsdlJsonNode): void => {
      nodes.push(node)
      if (node.kind === 'object') {
        for (const property of node.properties) {
          nodes.push(property)
          visit(property.value)
        }
      }
      else if (node.kind === 'array') {
        node.items.forEach(visit)
      }
    }
    visit(document.root as CsdlJsonObject)
  }

  return nodes
}

export function findCsdlNode(document: CsdlDocument, id: string): CsdlNode | undefined {
  return walkCsdlNodes(document).find(node => node.id === id)
}

/**
 * Resolves the Nullable facet for nullable-capable CSDL elements.
 *
 * The two encodings deliberately have different defaults: XML defaults omitted
 * Nullable to true, while JSON CSDL defaults it to false. The source field lets
 * semantic compilers distinguish an explicit choice from an encoding default.
 */
export function resolveCsdlNullable(
  document: CsdlDocument,
  node: CsdlXmlElement | CsdlJsonObject,
): CsdlResolvedFacet<boolean> {
  if (document.format === 'xml') {
    if (node.kind !== 'element')
      throw new TypeError('Expected an XML element for an XML CSDL document')
    const explicit = node.attributes.find(attribute => attribute.name.local === 'Nullable' && !attribute.name.namespace)?.value
    if (explicit === undefined)
      return { value: true, source: 'default' }
    if (!XML_BOOLEAN_REGEX.test(explicit))
      throw new TypeError(`Invalid XML Nullable facet "${explicit}"`)
    return { value: explicit.toLowerCase() === 'true', source: 'explicit' }
  }

  if (node.kind !== 'object')
    throw new TypeError('Expected a JSON object for a JSON CSDL document')
  const explicit = getJsonProperty(node, '$Nullable')
  if (explicit === undefined)
    return { value: false, source: 'default' }
  if (explicit.kind !== 'boolean')
    throw new TypeError('JSON $Nullable must be a boolean')
  return { value: explicit.value as boolean, source: 'explicit' }
}
