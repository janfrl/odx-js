import type {
  CsdlDiagnostic,
  CsdlDocument,
  CsdlJsonArray,
  CsdlJsonInput,
  CsdlJsonNode,
  CsdlJsonObject,
  CsdlJsonPrimitive,
  CsdlJsonProperty,
  CsdlParseOptions,
  CsdlParseResult,
  CsdlProvenance,
} from './types'
import {
  assignJsonIds,
  createSource,
  detectJsonVersion,
  diagnostic,
  normalizedMaxDepth,
  SourceLocator,
  summarizeSchemas,
} from './internal'

const JSON_DIGIT_REGEX = /\d/u
const JSON_ESCAPE_CHARACTER_REGEX = /["\\/bfnrt]/u
const JSON_NON_INTEGER_NUMBER_REGEX = /[.e]/iu
const JSON_NUMBER_DELIMITER_REGEX = /[\s,\]}]/u
const JSON_NUMBER_REGEX = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:e[+-]?\d+)?/iu
const JSON_UNICODE_ESCAPE_REGEX = /^[\dA-F]{4}$/iu
const JSON_WHITESPACE_REGEX = /[\t\n\r ]/u
class JsonParseFailure extends Error {}

class JsonTextParser {
  private offset = 0
  private readonly diagnostics: CsdlDiagnostic[] = []
  private readonly source
  private readonly locator: SourceLocator
  private readonly maxDepth: number

  constructor(
    private readonly input: string,
    private readonly options: CsdlParseOptions,
  ) {
    this.source = createSource('json', options.source)
    this.locator = new SourceLocator(input, this.source.id)
    this.maxDepth = normalizedMaxDepth(options.maxDepth)
  }

  parse(): CsdlParseResult {
    try {
      this.skipWhitespace()
      const root = this.parseValue(0)
      this.skipWhitespace()
      if (this.offset !== this.input.length)
        this.fail('ODX_METADATA_JSON_TRAILING_CONTENT', 'Unexpected content after the JSON document.', this.offset, this.input.length)
      if (root.kind !== 'object')
        this.fail('ODX_METADATA_JSON_ROOT_OBJECT', 'A CSDL JSON document must have an object root.', 0, this.input.length)

      assignJsonIds(root, this.source.id)
      const odataVersion = detectJsonVersion(root)
      if (odataVersion === 'unknown') {
        this.diagnostics.push(diagnostic(
          'ODX_METADATA_VERSION_UNKNOWN',
          'warning',
          'The OData version could not be established from an explicit $Version value.',
          root.provenance,
        ))
      }

      const document: CsdlDocument = {
        contractVersion: 1,
        idAlgorithm: 'odx-csdl-id-v1',
        format: 'json',
        odataVersion,
        source: this.source,
        root,
        schemas: summarizeSchemas(root),
        diagnostics: this.diagnostics,
        ...(this.options.includeRawSource ? { rawSource: this.input } : {}),
      }
      return { document, diagnostics: this.diagnostics }
    }
    catch (error) {
      if (!(error instanceof JsonParseFailure))
        throw error
      return { document: null, diagnostics: this.diagnostics }
    }
  }

  private parseValue(depth: number): CsdlJsonNode {
    this.skipWhitespace()
    const token = this.input[this.offset]
    if (token === '{')
      return this.parseObject(depth)
    if (token === '[')
      return this.parseArray(depth)
    if (token === '"')
      return this.parseStringNode()
    if (token === 't')
      return this.parseLiteral('true', 'boolean', true)
    if (token === 'f')
      return this.parseLiteral('false', 'boolean', false)
    if (token === 'n')
      return this.parseLiteral('null', 'null', null)
    if (token === '-' || (token && JSON_DIGIT_REGEX.test(token)))
      return this.parseNumber()
    return this.fail('ODX_METADATA_JSON_EXPECTED_VALUE', 'Expected a JSON value.', this.offset, this.offset + 1)
  }

  private parseObject(depth: number): CsdlJsonObject {
    this.assertDepth(depth)
    const start = this.offset++
    const properties: CsdlJsonProperty[] = []
    const names = new Set<string>()
    this.skipWhitespace()

    if (this.input[this.offset] === '}') {
      this.offset++
      return this.objectNode(start, properties)
    }

    while (this.offset < this.input.length) {
      this.skipWhitespace()
      const propertyStart = this.offset
      const key = this.readString()
      this.skipWhitespace()
      this.expect(':')
      const value = this.parseValue(depth + 1)
      const property: CsdlJsonProperty = {
        kind: 'property',
        id: '',
        name: key.value,
        value,
        provenance: this.locator.provenance(propertyStart, value.provenance.range?.end.offset ?? this.offset),
      }
      if (names.has(key.value)) {
        this.diagnostics.push(diagnostic(
          'ODX_METADATA_JSON_DUPLICATE_PROPERTY',
          'warning',
          `Duplicate JSON property "${key.value}" was preserved.`,
          property.provenance,
        ))
      }
      names.add(key.value)
      properties.push(property)
      this.skipWhitespace()

      if (this.input[this.offset] === '}') {
        this.offset++
        return this.objectNode(start, properties)
      }
      this.expect(',')
    }

    return this.fail('ODX_METADATA_JSON_UNCLOSED_OBJECT', 'JSON object is not closed.', start, this.offset)
  }

  private parseArray(depth: number): CsdlJsonArray {
    this.assertDepth(depth)
    const start = this.offset++
    const items: CsdlJsonNode[] = []
    this.skipWhitespace()

    if (this.input[this.offset] === ']') {
      this.offset++
      return {
        kind: 'array',
        id: '',
        items,
        provenance: this.locator.provenance(start, this.offset),
      }
    }

    while (this.offset < this.input.length) {
      items.push(this.parseValue(depth + 1))
      this.skipWhitespace()
      if (this.input[this.offset] === ']') {
        this.offset++
        return {
          kind: 'array',
          id: '',
          items,
          provenance: this.locator.provenance(start, this.offset),
        }
      }
      this.expect(',')
    }

    return this.fail('ODX_METADATA_JSON_UNCLOSED_ARRAY', 'JSON array is not closed.', start, this.offset)
  }

  private parseStringNode(): CsdlJsonPrimitive {
    const token = this.readString()
    return {
      kind: 'string',
      id: '',
      value: token.value,
      rawValue: token.raw,
      provenance: this.locator.provenance(token.start, token.end),
    }
  }

  private readString(): { value: string, raw: string, start: number, end: number } {
    const start = this.offset
    this.expect('"')
    let escaped = false

    while (this.offset < this.input.length) {
      const code = this.input.charCodeAt(this.offset)
      if (!escaped && code === 0x22) {
        this.offset++
        const raw = this.input.slice(start, this.offset)
        try {
          return {
            value: JSON.parse(raw) as string,
            raw,
            start,
            end: this.offset,
          }
        }
        catch {
          return this.fail('ODX_METADATA_JSON_INVALID_STRING', 'Invalid JSON string escape.', start, this.offset)
        }
      }
      if (!escaped && code < 0x20)
        this.fail('ODX_METADATA_JSON_CONTROL_CHARACTER', 'Unescaped control character in JSON string.', this.offset, this.offset + 1)
      if (escaped) {
        if (this.input[this.offset] === 'u') {
          const hex = this.input.slice(this.offset + 1, this.offset + 5)
          if (!JSON_UNICODE_ESCAPE_REGEX.test(hex))
            this.fail('ODX_METADATA_JSON_UNICODE_ESCAPE', 'Invalid JSON Unicode escape.', this.offset - 1, this.offset + 5)
          this.offset += 5
        }
        else {
          if (!JSON_ESCAPE_CHARACTER_REGEX.test(this.input[this.offset] || ''))
            this.fail('ODX_METADATA_JSON_INVALID_ESCAPE', 'Invalid JSON string escape.', this.offset - 1, this.offset + 1)
          this.offset++
        }
        escaped = false
      }
      else if (code === 0x5C) {
        escaped = true
        this.offset++
      }
      else {
        this.offset++
      }
    }

    return this.fail('ODX_METADATA_JSON_UNTERMINATED_STRING', 'JSON string is not closed.', start, this.offset)
  }

  private parseNumber(): CsdlJsonPrimitive {
    const start = this.offset
    const match = this.input.slice(this.offset).match(JSON_NUMBER_REGEX)
    if (!match)
      return this.fail('ODX_METADATA_JSON_INVALID_NUMBER', 'Invalid JSON number.', start, start + 1)
    const rawValue = match[0]
    this.offset += rawValue.length
    const next = this.input[this.offset]
    if (next && !JSON_NUMBER_DELIMITER_REGEX.test(next))
      return this.fail('ODX_METADATA_JSON_INVALID_NUMBER', 'Invalid character after JSON number.', start, this.offset + 1)

    const value = Number(rawValue)
    const integer = !JSON_NON_INTEGER_NUMBER_REGEX.test(rawValue)
    if (!Number.isFinite(value) || (integer && !Number.isSafeInteger(value))) {
      this.diagnostics.push(diagnostic(
        'ODX_METADATA_JSON_NUMBER_APPROXIMATED',
        'info',
        'The numeric convenience value is approximate; use rawValue for the exact CSDL lexeme.',
        this.locator.provenance(start, this.offset),
      ))
    }

    return {
      kind: 'number',
      id: '',
      value,
      rawValue,
      provenance: this.locator.provenance(start, this.offset),
    }
  }

  private parseLiteral(
    token: 'true' | 'false' | 'null',
    kind: 'boolean' | 'null',
    value: boolean | null,
  ): CsdlJsonPrimitive {
    const start = this.offset
    if (!this.input.startsWith(token, this.offset))
      return this.fail('ODX_METADATA_JSON_INVALID_LITERAL', `Expected ${token}.`, start, start + token.length)
    this.offset += token.length
    return {
      kind,
      id: '',
      value,
      rawValue: token,
      provenance: this.locator.provenance(start, this.offset),
    }
  }

  private objectNode(start: number, properties: CsdlJsonProperty[]): CsdlJsonObject {
    return {
      kind: 'object',
      id: '',
      properties,
      provenance: this.locator.provenance(start, this.offset),
    }
  }

  private assertDepth(depth: number): void {
    if (depth >= this.maxDepth) {
      this.fail(
        'ODX_METADATA_MAX_DEPTH',
        `JSON nesting exceeds the configured maximum of ${this.maxDepth}.`,
        this.offset,
        this.offset,
      )
    }
  }

  private skipWhitespace(): void {
    while (JSON_WHITESPACE_REGEX.test(this.input[this.offset] || ''))
      this.offset++
  }

  private expect(value: string): void {
    if (!this.input.startsWith(value, this.offset))
      this.fail('ODX_METADATA_JSON_EXPECTED_TOKEN', `Expected "${value}".`, this.offset, this.offset + value.length)
    this.offset += value.length
  }

  private fail(code: string, message: string, start: number, end: number): never {
    this.diagnostics.push(diagnostic(code, 'error', message, this.locator.provenance(start, end)))
    throw new JsonParseFailure(message)
  }
}

function provenance(sourceId: string): CsdlProvenance {
  return { sourceId, path: '' }
}

function fromJsonInput(
  value: CsdlJsonInput,
  sourceId: string,
  diagnostics: CsdlDiagnostic[],
  maxDepth: number,
  depth: number,
  ancestors: Set<object>,
): CsdlJsonNode {
  if (depth >= maxDepth)
    throw new RangeError(`JSON nesting exceeds the configured maximum of ${maxDepth}.`)

  if (value === null) {
    return { kind: 'null', id: '', value: null, rawValue: 'null', provenance: provenance(sourceId) }
  }
  if (typeof value === 'string') {
    return { kind: 'string', id: '', value, rawValue: JSON.stringify(value), provenance: provenance(sourceId) }
  }
  if (typeof value === 'boolean') {
    return { kind: 'boolean', id: '', value, rawValue: String(value), provenance: provenance(sourceId) }
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value))
      throw new TypeError('CSDL JSON object input cannot contain non-finite numbers')
    if (!Number.isSafeInteger(value) && Number.isInteger(value)) {
      diagnostics.push(diagnostic(
        'ODX_METADATA_JSON_LEXEME_UNAVAILABLE',
        'warning',
        'Object input cannot recover the original large-integer lexeme; pass JSON text for exact preservation.',
        provenance(sourceId),
      ))
    }
    return { kind: 'number', id: '', value, rawValue: JSON.stringify(value), provenance: provenance(sourceId) }
  }

  if (ancestors.has(value))
    throw new TypeError('CSDL JSON object input cannot contain cycles')
  ancestors.add(value)
  let node: CsdlJsonNode

  if (Array.isArray(value)) {
    node = {
      kind: 'array',
      id: '',
      items: value.map(item => fromJsonInput(item, sourceId, diagnostics, maxDepth, depth + 1, ancestors)),
      provenance: provenance(sourceId),
    }
  }
  else {
    node = {
      kind: 'object',
      id: '',
      properties: Object.entries(value).map(([name, item]) => ({
        kind: 'property',
        id: '',
        name,
        value: fromJsonInput(item, sourceId, diagnostics, maxDepth, depth + 1, ancestors),
        provenance: provenance(sourceId),
      })),
      provenance: provenance(sourceId),
    }
  }

  ancestors.delete(value)
  return node
}

function parseCsdlJsonObject(input: Exclude<CsdlJsonInput, string>, options: CsdlParseOptions): CsdlParseResult {
  const source = createSource('json', options.source)
  const diagnostics: CsdlDiagnostic[] = [diagnostic(
    'ODX_METADATA_JSON_SOURCE_LOCATIONS_UNAVAILABLE',
    'info',
    'Object input has no token locations or duplicate-key information; pass JSON text when provenance matters.',
    { sourceId: source.id, path: '' },
  )]

  try {
    const root = fromJsonInput(input, source.id, diagnostics, normalizedMaxDepth(options.maxDepth), 0, new Set())
    if (root.kind !== 'object')
      throw new TypeError('A CSDL JSON document must have an object root')
    assignJsonIds(root, source.id)
    const odataVersion = detectJsonVersion(root)
    if (odataVersion === 'unknown') {
      diagnostics.push(diagnostic(
        'ODX_METADATA_VERSION_UNKNOWN',
        'warning',
        'The OData version could not be established from an explicit $Version value.',
        root.provenance,
      ))
    }
    const document: CsdlDocument = {
      contractVersion: 1,
      idAlgorithm: 'odx-csdl-id-v1',
      format: 'json',
      odataVersion,
      source,
      root,
      schemas: summarizeSchemas(root),
      diagnostics,
    }
    return { document, diagnostics }
  }
  catch (error) {
    diagnostics.push(diagnostic(
      error instanceof RangeError ? 'ODX_METADATA_MAX_DEPTH' : 'ODX_METADATA_JSON_OBJECT_INVALID',
      'error',
      error instanceof Error ? error.message : 'Invalid CSDL JSON object input.',
      { sourceId: source.id, path: '' },
    ))
    return { document: null, diagnostics }
  }
}

export function parseCsdlJson(input: string | Exclude<CsdlJsonInput, string>, options: CsdlParseOptions = {}): CsdlParseResult {
  return typeof input === 'string'
    ? new JsonTextParser(input, options).parse()
    : parseCsdlJsonObject(input, options)
}
