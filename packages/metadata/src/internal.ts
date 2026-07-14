import type {
  CsdlDiagnostic,
  CsdlJsonNode,
  CsdlJsonObject,
  CsdlJsonProperty,
  CsdlProvenance,
  CsdlQualifiedName,
  CsdlSchema,
  CsdlSchemaMember,
  CsdlSource,
  CsdlSourceInput,
  CsdlSourcePosition,
  CsdlSourceRange,
  CsdlXmlAttribute,
  CsdlXmlElement,
  CsdlXmlNode,
  ODataVersion,
} from './types'

export const DEFAULT_MAX_DEPTH = 256
export const XML_NAMESPACE = 'http://www.w3.org/XML/1998/namespace'
export const XMLNS_NAMESPACE = 'http://www.w3.org/2000/xmlns/'

export class SourceLocator {
  private readonly lineStarts = [0]

  constructor(
    private readonly input: string,
    private readonly sourceId: string,
  ) {
    for (let index = 0; index < input.length; index++) {
      if (input.charCodeAt(index) === 10)
        this.lineStarts.push(index + 1)
    }
  }

  range(start: number, end: number): CsdlSourceRange {
    return {
      start: this.position(start),
      end: this.position(end),
    }
  }

  provenance(start: number, end: number, path = ''): CsdlProvenance {
    return {
      sourceId: this.sourceId,
      path,
      range: this.range(start, end),
    }
  }

  rootProvenance(): CsdlProvenance {
    return {
      sourceId: this.sourceId,
      path: '',
      range: this.range(0, this.input.length),
    }
  }

  private position(offset: number): CsdlSourcePosition {
    let low = 0
    let high = this.lineStarts.length
    while (low + 1 < high) {
      const middle = (low + high) >>> 1
      if (this.lineStarts[middle]! <= offset)
        low = middle
      else
        high = middle
    }

    return {
      offset,
      line: low + 1,
      column: offset - this.lineStarts[low]! + 1,
    }
  }
}

export function createSource(format: 'xml' | 'json', input?: CsdlSourceInput): CsdlSource {
  return {
    id: input?.id || input?.uri || 'inline',
    format,
    ...(input?.uri ? { uri: input.uri } : {}),
    ...(input?.layer ? { layer: input.layer } : {}),
  }
}

export function diagnostic(
  code: string,
  severity: CsdlDiagnostic['severity'],
  message: string,
  provenance: CsdlProvenance,
): CsdlDiagnostic {
  return { code, severity, message, provenance }
}

export function normalizedMaxDepth(value: number | undefined): number {
  if (value === undefined)
    return DEFAULT_MAX_DEPTH
  if (!Number.isSafeInteger(value) || value < 1)
    throw new TypeError('maxDepth must be a positive safe integer')
  return value
}

export function qualifiedName(qualified: string, namespaces: Record<string, string>, attribute = false): CsdlQualifiedName {
  const separator = qualified.indexOf(':')
  const prefix = separator === -1 ? undefined : qualified.slice(0, separator)
  const local = separator === -1 ? qualified : qualified.slice(separator + 1)
  const namespace = prefix
    ? namespaces[prefix]
    : attribute
      ? undefined
      : namespaces['']

  return {
    qualified,
    local,
    ...(prefix ? { prefix } : {}),
    ...(namespace ? { namespace } : {}),
  }
}

function xmlIdentity(node: CsdlXmlElement): string {
  const attribute = (local: string): string | undefined => node.attributes.find(item => item.name.local === local)?.value
  const pieces = [
    attribute('Namespace'),
    attribute('Name'),
    attribute('Term'),
    attribute('Qualifier'),
    attribute('Role'),
    attribute('Uri'),
  ].filter((value): value is string => Boolean(value))

  if (node.name.local === 'Action' || node.name.local === 'Function') {
    const signature = node.children
      .filter((child): child is CsdlXmlElement => child.kind === 'element' && child.name.local === 'Parameter')
      .map(child => child.attributes.find(item => item.name.local === 'Type')?.value || '?')
      .join(',')
    if (signature)
      pieces.push(`(${signature})`)
  }

  return pieces.join(':')
}

function pathSegment(name: string, identity = ''): string {
  return identity
    ? `${encodeURIComponent(name)}[${encodeURIComponent(identity)}]`
    : encodeURIComponent(name)
}

export function assignXmlIds(root: CsdlXmlElement, sourceId: string): void {
  const visit = (node: CsdlXmlNode, parentPath: string, siblingIndex: number): void => {
    const identity = node.kind === 'element' ? xmlIdentity(node) : ''
    const base = node.kind === 'processing-instruction'
      ? `processing-instruction[${encodeURIComponent(node.target)}]`
      : node.kind
    const segment = node.kind === 'element'
      ? pathSegment(node.name.local, identity)
      : `${base}[${siblingIndex}]`
    node.id = parentPath ? `${parentPath}/${segment}` : `/${segment}`
    node.provenance.sourceId = sourceId
    node.provenance.path = node.id

    if (node.kind !== 'element')
      return

    const occurrences = new Map<string, number>()
    for (const child of node.children) {
      const childIdentity = child.kind === 'element' ? xmlIdentity(child) : ''
      const key = child.kind === 'element'
        ? pathSegment(child.name.local, childIdentity)
        : child.kind === 'processing-instruction'
          ? `processing-instruction[${child.target}]`
          : child.kind
      const occurrence = occurrences.get(key) || 0
      occurrences.set(key, occurrence + 1)
      visit(child, node.id, occurrence)
    }

    for (const attribute of node.attributes) {
      attribute.provenance.sourceId = sourceId
      attribute.provenance.path = `${node.id}/@${encodeURIComponent(attribute.name.qualified)}`
    }
  }

  visit(root, '', 0)
}

export function assignJsonIds(root: CsdlJsonObject, sourceId: string): void {
  const visitNode = (node: CsdlJsonNode, path: string): void => {
    node.id = path
    node.provenance.sourceId = sourceId
    node.provenance.path = path

    if (node.kind === 'object') {
      const occurrences = new Map<string, number>()
      for (const property of node.properties) {
        const occurrence = occurrences.get(property.name) || 0
        occurrences.set(property.name, occurrence + 1)
        const suffix = occurrence === 0 ? '' : `~${occurrence}`
        const propertyPath = `${path}/${encodeURIComponent(property.name)}${suffix}`
        property.id = propertyPath
        property.provenance.sourceId = sourceId
        property.provenance.path = propertyPath
        visitNode(property.value, `${propertyPath}/value`)
      }
    }
    else if (node.kind === 'array') {
      node.items.forEach((item, index) => visitNode(item, `${path}/${index}`))
    }
  }

  visitNode(root, '/$root')
}

export function xmlAttribute(element: CsdlXmlElement, localName: string): CsdlXmlAttribute | undefined {
  return element.attributes.find(attribute => attribute.name.local === localName)
}

export function jsonProperty(object: CsdlJsonObject, name: string): CsdlJsonProperty | undefined {
  return object.properties.find(property => property.name === name)
}

function summarizeXml(root: CsdlXmlElement): CsdlSchema[] {
  const schemas: CsdlSchema[] = []

  const visit = (node: CsdlXmlNode): void => {
    if (node.kind !== 'element')
      return

    if (node.name.local === 'Schema') {
      const namespace = xmlAttribute(node, 'Namespace')?.value
      if (namespace) {
        const overloads = new Map<string, number>()
        const members: CsdlSchemaMember[] = node.children
          .filter((child): child is CsdlXmlElement => child.kind === 'element')
          .map((child) => {
            const name = xmlAttribute(child, 'Name')?.value
            const overloadKey = `${child.name.local}:${name || ''}`
            const overloadIndex = overloads.get(overloadKey) || 0
            overloads.set(overloadKey, overloadIndex + 1)
            return {
              kind: child.name.local,
              ...(name ? { name } : {}),
              nodeId: child.id,
              ...((child.name.local === 'Action' || child.name.local === 'Function')
                ? { overloadIndex }
                : {}),
            }
          })
        schemas.push({
          namespace,
          ...(xmlAttribute(node, 'Alias')?.value
            ? { alias: xmlAttribute(node, 'Alias')!.value }
            : {}),
          nodeId: node.id,
          members,
        })
      }
    }

    node.children.forEach(visit)
  }

  visit(root)
  return schemas
}

function jsonStringProperty(object: CsdlJsonObject, name: string): string | undefined {
  const value = jsonProperty(object, name)?.value
  return value?.kind === 'string' ? value.value as string : undefined
}

function summarizeJson(root: CsdlJsonObject): CsdlSchema[] {
  const schemas: CsdlSchema[] = []

  for (const property of root.properties) {
    if (property.name.startsWith('$') || property.name.startsWith('@') || property.value.kind !== 'object')
      continue

    const schemaObject = property.value
    const members: CsdlSchemaMember[] = []
    const overloads = new Map<string, number>()

    for (const memberProperty of schemaObject.properties) {
      if (memberProperty.name.startsWith('$') || memberProperty.name.startsWith('@'))
        continue

      const candidates = memberProperty.value.kind === 'object'
        ? [memberProperty.value]
        : memberProperty.value.kind === 'array'
          ? memberProperty.value.items.filter((item): item is CsdlJsonObject => item.kind === 'object')
          : []

      for (const member of candidates) {
        const explicitKind = jsonStringProperty(member, '$Kind')
        const kind = explicitKind || (memberProperty.value.kind === 'object' ? 'EntityType' : undefined)
        if (!kind)
          continue
        const overloadKey = `${kind}:${memberProperty.name}`
        const overloadIndex = overloads.get(overloadKey) || 0
        overloads.set(overloadKey, overloadIndex + 1)
        members.push({
          kind,
          name: memberProperty.name,
          nodeId: memberProperty.value.kind === 'array' ? member.id : memberProperty.id,
          ...((kind === 'Action' || kind === 'Function') ? { overloadIndex } : {}),
        })
      }
    }
    schemas.push({
      namespace: property.name,
      ...(jsonStringProperty(schemaObject, '$Alias')
        ? { alias: jsonStringProperty(schemaObject, '$Alias')! }
        : {}),
      nodeId: property.id,
      members,
    })
  }

  return schemas
}

export function summarizeSchemas(root: CsdlXmlElement | CsdlJsonObject): CsdlSchema[] {
  return root.kind === 'element' ? summarizeXml(root) : summarizeJson(root)
}

export function detectXmlVersion(root: CsdlXmlElement): ODataVersion {
  const rootVersion = xmlAttribute(root, 'Version')?.value
  if (rootVersion === '4.0' || rootVersion === '4.01')
    return rootVersion
  if (rootVersion !== undefined)
    return 'unknown'

  let dataServiceVersion: string | undefined
  const visit = (node: CsdlXmlNode): void => {
    if (dataServiceVersion || node.kind !== 'element')
      return
    if (node.name.local === 'DataServices')
      dataServiceVersion = xmlAttribute(node, 'DataServiceVersion')?.value
    node.children.forEach(visit)
  }
  visit(root)

  if (dataServiceVersion === '1.0' || dataServiceVersion === '2.0')
    return '2.0'
  return 'unknown'
}

export function detectJsonVersion(root: CsdlJsonObject): ODataVersion {
  const version = jsonStringProperty(root, '$Version')
  if (version === '4.0' || version === '4.01')
    return version
  return 'unknown'
}
