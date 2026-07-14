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
