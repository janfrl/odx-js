export type CsdlFormat = 'xml' | 'json'
export type ODataVersion = '2.0' | '4.0' | '4.01' | 'unknown'
export type CsdlDiagnosticSeverity = 'info' | 'warning' | 'error'

export interface CsdlSourceInput {
  id?: string
  uri?: string
  layer?: string
}

export interface CsdlSource {
  id: string
  format: CsdlFormat
  uri?: string
  layer?: string
}

export interface CsdlSourcePosition {
  offset: number
  line: number
  column: number
}

export interface CsdlSourceRange {
  start: CsdlSourcePosition
  end: CsdlSourcePosition
}

export interface CsdlProvenance {
  sourceId: string
  path: string
  range?: CsdlSourceRange
}

export interface CsdlDiagnostic {
  code: string
  severity: CsdlDiagnosticSeverity
  message: string
  provenance: CsdlProvenance
}

export interface CsdlQualifiedName {
  qualified: string
  local: string
  prefix?: string
  namespace?: string
}

interface CsdlNodeBase {
  id: string
  provenance: CsdlProvenance
}

export interface CsdlXmlAttribute {
  name: CsdlQualifiedName
  value: string
  rawValue: string
  provenance: CsdlProvenance
}

export interface CsdlXmlElement extends CsdlNodeBase {
  kind: 'element'
  name: CsdlQualifiedName
  /** Namespace bindings in scope for this element. The empty key is the default namespace. */
  namespaces: Record<string, string>
  attributes: CsdlXmlAttribute[]
  /** Element order is significant and is never sorted by the parser. */
  children: CsdlXmlNode[]
}

export interface CsdlXmlText extends CsdlNodeBase {
  kind: 'text' | 'cdata' | 'comment'
  value: string
}

export interface CsdlXmlProcessingInstruction extends CsdlNodeBase {
  kind: 'processing-instruction'
  target: string
  value: string
}

export type CsdlXmlNode = CsdlXmlElement | CsdlXmlText | CsdlXmlProcessingInstruction

export interface CsdlJsonObject extends CsdlNodeBase {
  kind: 'object'
  /** Properties retain source order and duplicates. */
  properties: CsdlJsonProperty[]
}

export interface CsdlJsonProperty extends CsdlNodeBase {
  kind: 'property'
  name: string
  value: CsdlJsonNode
}

export interface CsdlJsonArray extends CsdlNodeBase {
  kind: 'array'
  items: CsdlJsonNode[]
}

export interface CsdlJsonPrimitive extends CsdlNodeBase {
  kind: 'string' | 'number' | 'boolean' | 'null'
  value: string | number | boolean | null
  /** Exact JSON token, preserving large integer, decimal, and escaped string lexemes. */
  rawValue: string
}

export type CsdlJsonNode = CsdlJsonObject | CsdlJsonArray | CsdlJsonPrimitive
export type CsdlNode = CsdlXmlNode | CsdlJsonNode | CsdlJsonProperty

export type CsdlJsonInput
  = | null
    | boolean
    | number
    | string
    | CsdlJsonInput[]
    | { [key: string]: CsdlJsonInput }

export interface CsdlSchemaMember {
  kind: string
  name?: string
  nodeId: string
  overloadIndex?: number
}

export interface CsdlSchema {
  namespace: string
  alias?: string
  nodeId: string
  members: CsdlSchemaMember[]
}

export interface CsdlDocument {
  /** Version of this package's serialized document contract, not the OData version. */
  contractVersion: 1
  /** Version of the deterministic node identity algorithm. */
  idAlgorithm: 'odx-csdl-id-v1'
  format: CsdlFormat
  odataVersion: ODataVersion
  source: CsdlSource
  root: CsdlXmlElement | CsdlJsonObject
  schemas: CsdlSchema[]
  diagnostics: CsdlDiagnostic[]
  /** Present only when includeRawSource is explicitly enabled. */
  rawSource?: string
}

export interface CsdlParseOptions {
  source?: CsdlSourceInput
  includeRawSource?: boolean
  /** Maximum XML element or JSON container nesting. Defaults to 256. */
  maxDepth?: number
}

export interface CsdlParseResult {
  document: CsdlDocument | null
  diagnostics: CsdlDiagnostic[]
}

export interface CsdlArtifact {
  contractVersion: 1
  canonicalizationVersion: 'odx-csdl-canonical-v1'
  algorithm: 'SHA-256'
  documentHash: string
  sourceHash?: string
  canonical: string
  document: string
}

export interface CsdlSerializeOptions {
  includeLocations?: boolean
  includeRawSource?: boolean
}
