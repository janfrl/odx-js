import type {
  CsdlArtifact,
  CsdlDocument,
  CsdlJsonNode,
  CsdlSerializeOptions,
  CsdlXmlElement,
  CsdlXmlNode,
} from './types'
import { XMLNS_NAMESPACE } from './internal'

const XML_WHITESPACE_ONLY_REGEX = /^\s*$/u

type Serializable = null | boolean | number | string | Serializable[] | { [key: string]: Serializable }

function stableValue(value: unknown): Serializable | undefined {
  if (value === undefined)
    return undefined
  if (value === null || typeof value === 'string' || typeof value === 'boolean')
    return value
  if (typeof value === 'number')
    return Number.isFinite(value) ? value : String(value)
  if (Array.isArray(value))
    return value.map(item => stableValue(item) ?? null)
  if (typeof value === 'object') {
    const output: Record<string, Serializable> = {}
    for (const key of Object.keys(value).sort()) {
      const child = stableValue((value as Record<string, unknown>)[key])
      if (child !== undefined)
        output[key] = child
    }
    return output
  }
  return String(value)
}

function stableStringify(value: unknown): string {
  return JSON.stringify(stableValue(value))
}

function compareCodeUnits(left: string, right: string): number {
  if (left < right)
    return -1
  if (left > right)
    return 1
  return 0
}

function withoutSerializationDetails(document: CsdlDocument, options: CsdlSerializeOptions): unknown {
  const includeLocations = options.includeLocations ?? true
  const includeRawSource = options.includeRawSource ?? false

  const strip = (value: unknown, key?: string): unknown => {
    if (key === 'rawSource' && !includeRawSource)
      return undefined
    if (key === 'range' && !includeLocations)
      return undefined
    if (Array.isArray(value))
      return value.map(item => strip(item))
    if (value && typeof value === 'object') {
      const output: Record<string, unknown> = {}
      for (const [childKey, child] of Object.entries(value)) {
        const stripped = strip(child, childKey)
        if (stripped !== undefined)
          output[childKey] = stripped
      }
      return output
    }
    return value
  }

  return strip(document)
}

/**
 * Serializes the plain-data public contract with stable object-key ordering.
 * Source-order arrays (XML children, JSON properties, expressions) remain ordered.
 */
export function serializeCsdlDocument(
  document: CsdlDocument,
  options: CsdlSerializeOptions = {},
): string {
  return stableStringify(withoutSerializationDetails(document, options))
}

function expandedName(name: { local: string, namespace?: string }): string {
  return name.namespace ? `{${name.namespace}}${name.local}` : name.local
}

function canonicalXml(node: CsdlXmlNode): Serializable | undefined {
  if (node.kind === 'comment' || node.kind === 'processing-instruction')
    return undefined
  if (node.kind === 'text' || node.kind === 'cdata') {
    if (XML_WHITESPACE_ONLY_REGEX.test(node.value))
      return undefined
    return { text: node.value }
  }

  const element = node as CsdlXmlElement

  const attributes = element.attributes
    .filter(attribute => attribute.name.namespace !== XMLNS_NAMESPACE)
    .map(attribute => [expandedName(attribute.name), attribute.value] as const)
    .sort(([leftName, leftValue], [rightName, rightValue]) =>
      compareCodeUnits(leftName, rightName) || compareCodeUnits(leftValue, rightValue),
    )
    .map(([name, value]) => ({ name, value }))

  return {
    kind: 'element',
    name: expandedName(element.name),
    attributes,
    children: element.children
      .map(canonicalXml)
      .filter((child): child is Serializable => child !== undefined),
  }
}

function canonicalJson(node: CsdlJsonNode): Serializable {
  if (node.kind === 'object') {
    const properties = node.properties
      .map(property => ({
        name: property.name,
        value: canonicalJson(property.value),
      }))
      .sort((left, right) =>
        compareCodeUnits(left.name, right.name)
        || compareCodeUnits(stableStringify(left.value), stableStringify(right.value)),
      )
    return { kind: 'object', properties }
  }

  if (node.kind === 'array')
    return { kind: 'array', items: node.items.map(canonicalJson) }

  if (node.kind === 'number')
    return { kind: 'number', rawValue: node.rawValue }

  return {
    kind: node.kind,
    value: node.value,
  }
}

/**
 * Produces the semantic input to the versioned hash. It excludes source
 * locations, source identity, raw input, comments, processing instructions,
 * insignificant XML whitespace, and JSON object-property ordering.
 */
export function canonicalizeCsdlDocument(document: CsdlDocument): string {
  const canonical = document.format === 'xml'
    ? canonicalXml(document.root as CsdlXmlElement)
    : canonicalJson(document.root as import('./types').CsdlJsonObject)

  return stableStringify({
    canonicalizationVersion: 'odx-csdl-canonical-v1',
    format: document.format,
    odataVersion: document.odataVersion,
    value: canonical,
  })
}

async function sha256(value: string | Uint8Array): Promise<string> {
  const crypto = globalThis.crypto
  if (!crypto?.subtle)
    throw new Error('SHA-256 requires the standard Web Crypto API')
  const bytes = typeof value === 'string' ? new TextEncoder().encode(value) : new Uint8Array(value)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')
}

export async function hashCsdlDocument(document: CsdlDocument): Promise<string> {
  return sha256(canonicalizeCsdlDocument(document))
}

export async function hashCsdlSource(source: string | Uint8Array): Promise<string> {
  return sha256(source)
}

export async function createCsdlArtifact(
  document: CsdlDocument,
  source?: string | Uint8Array,
): Promise<CsdlArtifact> {
  const canonical = canonicalizeCsdlDocument(document)
  const exactSource = source ?? document.rawSource
  return {
    contractVersion: 1,
    canonicalizationVersion: 'odx-csdl-canonical-v1',
    algorithm: 'SHA-256',
    documentHash: await sha256(canonical),
    ...(exactSource === undefined ? {} : { sourceHash: await sha256(exactSource) }),
    canonical,
    document: serializeCsdlDocument(document),
  }
}
