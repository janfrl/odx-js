import type { CsdlJsonInput, CsdlParseOptions, CsdlParseResult } from './types'
import { parseCsdlJson } from './json'
import { parseCsdlXml } from './xml'

export { parseCsdlJson } from './json'
export type { CsdlResolvedFacet } from './model'

export {
  findCsdlNode,
  getJsonProperties,
  getJsonProperty,
  getXmlAttribute,
  getXmlChildren,
  resolveCsdlNullable,
  walkCsdlNodes,
} from './model'
export {
  canonicalizeCsdlDocument,
  createCsdlArtifact,
  hashCsdlDocument,
  hashCsdlSource,
  serializeCsdlDocument,
} from './serialize'
export type {
  CsdlArtifact,
  CsdlDiagnostic,
  CsdlDiagnosticSeverity,
  CsdlDocument,
  CsdlFormat,
  CsdlJsonArray,
  CsdlJsonInput,
  CsdlJsonNode,
  CsdlJsonObject,
  CsdlJsonPrimitive,
  CsdlJsonProperty,
  CsdlNode,
  CsdlParseOptions,
  CsdlParseResult,
  CsdlProvenance,
  CsdlQualifiedName,
  CsdlSchema,
  CsdlSchemaMember,
  CsdlSerializeOptions,
  CsdlSource,
  CsdlSourceInput,
  CsdlSourcePosition,
  CsdlSourceRange,
  CsdlXmlAttribute,
  CsdlXmlElement,
  CsdlXmlNode,
  CsdlXmlProcessingInstruction,
  CsdlXmlText,
  ODataVersion,
} from './types'
export { parseCsdlXml } from './xml'

export interface ParseCsdlOptions extends CsdlParseOptions {
  format?: 'xml' | 'json'
}

/**
 * Parses XML or JSON CSDL without I/O. For ambiguous input, pass format
 * explicitly. JSON text must have an object root.
 */
export function parseCsdl(
  input: string | Exclude<CsdlJsonInput, string>,
  options: ParseCsdlOptions = {},
): CsdlParseResult {
  if (options.format === 'xml')
    return parseCsdlXml(String(input), options)
  if (options.format === 'json' || typeof input !== 'string')
    return parseCsdlJson(input, options)
  return input.trimStart().startsWith('<')
    ? parseCsdlXml(input, options)
    : parseCsdlJson(input, options)
}
