import type {
  CsdlDiagnostic,
  CsdlDocument,
  CsdlParseOptions,
  CsdlParseResult,
  CsdlXmlAttribute,
  CsdlXmlElement,
  CsdlXmlNode,
} from './types'
import {
  assignXmlIds,
  createSource,
  detectXmlVersion,
  diagnostic,
  normalizedMaxDepth,
  qualifiedName,
  SourceLocator,
  summarizeSchemas,
  XML_NAMESPACE,
  XMLNS_NAMESPACE,
} from './internal'

const ENTITY_DECLARATION_REGEX = /^<!ENTITY\b/iu
const ENTITY_REFERENCE_REGEX = /&(#x[\dA-Fa-f]+|#\d+|amp|lt|gt|quot|apos);/g
const XML_DOCUMENT_TYPE_REGEX = /^<!DOCTYPE\b/iu
const XML_NAME_REGEX = /^[A-Za-z_][\w.:-]*$/u
const XML_NAME_TERMINATOR_REGEX = /[\s/>=]/u
const XML_UNSUPPORTED_ENTITY_REGEX = /&(?!#x[\dA-Fa-f]+;|#\d+;|amp;|lt;|gt;|quot;|apos;)/u
const XML_WHITESPACE_REGEX = /\s/u
interface RawAttribute {
  name: string
  value: string
  rawValue: string
  start: number
  end: number
}

class XmlParseFailure extends Error {}

class XmlParser {
  private offset = 0
  private readonly diagnostics: CsdlDiagnostic[] = []
  private readonly source
  private readonly locator: SourceLocator
  private readonly maxDepth: number

  constructor(
    private readonly input: string,
    private readonly options: CsdlParseOptions,
  ) {
    this.source = createSource('xml', options.source)
    this.locator = new SourceLocator(input, this.source.id)
    this.maxDepth = normalizedMaxDepth(options.maxDepth)
  }

  parse(): CsdlParseResult {
    try {
      if (this.input.charCodeAt(0) === 0xFEFF)
        this.offset++

      this.skipDocumentTrivia()
      const remaining = this.input.slice(this.offset)
      if (XML_DOCUMENT_TYPE_REGEX.test(remaining) || ENTITY_DECLARATION_REGEX.test(remaining)) {
        this.fail(
          'ODX_METADATA_XML_DTD_FORBIDDEN',
          'DTD and entity declarations are forbidden; CSDL parsing never resolves external entities.',
          this.offset,
          this.input.length,
        )
      }
      if (!this.startsWith('<'))
        this.fail('ODX_METADATA_XML_ROOT_MISSING', 'Expected an XML root element.', this.offset, this.offset)

      const root = this.parseElement({
        xml: XML_NAMESPACE,
      }, 0)
      this.skipDocumentTrivia()
      this.skipWhitespace()
      if (this.offset !== this.input.length) {
        this.fail(
          'ODX_METADATA_XML_TRAILING_CONTENT',
          'Unexpected content after the XML root element.',
          this.offset,
          this.input.length,
        )
      }

      assignXmlIds(root, this.source.id)
      const odataVersion = detectXmlVersion(root)
      if (odataVersion === 'unknown') {
        this.diagnostics.push(diagnostic(
          'ODX_METADATA_VERSION_UNKNOWN',
          'warning',
          'The OData version could not be established from explicit CSDL version metadata.',
          root.provenance,
        ))
      }

      const document: CsdlDocument = {
        contractVersion: 1,
        idAlgorithm: 'odx-csdl-id-v1',
        format: 'xml',
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
      if (!(error instanceof XmlParseFailure))
        throw error
      return { document: null, diagnostics: this.diagnostics }
    }
  }

  private parseElement(parentNamespaces: Record<string, string>, depth: number): CsdlXmlElement {
    if (depth >= this.maxDepth) {
      this.fail(
        'ODX_METADATA_MAX_DEPTH',
        `XML nesting exceeds the configured maximum of ${this.maxDepth}.`,
        this.offset,
        this.offset,
      )
    }

    const start = this.offset
    this.expect('<')
    const rawName = this.readName()
    const rawAttributes: RawAttribute[] = []
    let selfClosing = false

    while (this.offset < this.input.length) {
      this.skipWhitespace()
      if (this.startsWith('/>')) {
        this.offset += 2
        selfClosing = true
        break
      }
      if (this.startsWith('>')) {
        this.offset++
        break
      }
      rawAttributes.push(this.readAttribute())
    }

    if (this.offset >= this.input.length && !selfClosing && this.input[this.offset - 1] !== '>')
      this.fail('ODX_METADATA_XML_UNTERMINATED_TAG', `Unterminated element <${rawName}>.`, start, this.offset)

    const namespaces = { ...parentNamespaces }
    for (const attribute of rawAttributes) {
      if (attribute.name === 'xmlns')
        namespaces[''] = attribute.value
      else if (attribute.name.startsWith('xmlns:'))
        namespaces[attribute.name.slice(6)] = attribute.value
    }

    const attributes: CsdlXmlAttribute[] = rawAttributes.map((attribute) => {
      const name = attribute.name === 'xmlns'
        ? { qualified: 'xmlns', local: 'xmlns', namespace: XMLNS_NAMESPACE }
        : attribute.name.startsWith('xmlns:')
          ? {
              qualified: attribute.name,
              local: attribute.name.slice(6),
              prefix: 'xmlns',
              namespace: XMLNS_NAMESPACE,
            }
          : qualifiedName(attribute.name, namespaces, true)
      return {
        name,
        value: attribute.value,
        rawValue: attribute.rawValue,
        provenance: this.locator.provenance(attribute.start, attribute.end),
      }
    })

    const elementName = qualifiedName(rawName, namespaces)
    if (elementName.prefix && !elementName.namespace)
      this.fail('ODX_METADATA_XML_UNBOUND_PREFIX', `Unbound XML prefix: ${elementName.prefix}`, start, this.offset)

    const expandedAttributes = new Set<string>()
    for (const attribute of attributes) {
      if (attribute.name.prefix && !attribute.name.namespace)
        this.fail('ODX_METADATA_XML_UNBOUND_PREFIX', `Unbound XML prefix: ${attribute.name.prefix}`, attribute.provenance.range?.start.offset ?? start, attribute.provenance.range?.end.offset ?? this.offset)
      const expanded = `${attribute.name.namespace || ''}:${attribute.name.local}`
      if (expandedAttributes.has(expanded))
        this.fail('ODX_METADATA_XML_DUPLICATE_ATTRIBUTE', `Duplicate XML attribute: ${attribute.name.qualified}`, attribute.provenance.range?.start.offset ?? start, attribute.provenance.range?.end.offset ?? this.offset)
      expandedAttributes.add(expanded)
    }

    const element: CsdlXmlElement = {
      kind: 'element',
      id: '',
      name: elementName,
      namespaces,
      attributes,
      children: [],
      provenance: this.locator.provenance(start, this.offset),
    }

    if (selfClosing)
      return element

    while (this.offset < this.input.length) {
      if (this.startsWith('</')) {
        this.offset += 2
        const closingName = this.readName()
        this.skipWhitespace()
        this.expect('>')
        if (closingName !== rawName) {
          this.fail(
            'ODX_METADATA_XML_MISMATCHED_TAG',
            `Expected </${rawName}> but found </${closingName}>.`,
            start,
            this.offset,
          )
        }
        element.provenance.range = this.locator.range(start, this.offset)
        return element
      }

      if (this.startsWith('<!--')) {
        element.children.push(this.parseDelimitedNode('comment', '<!--', '-->'))
      }
      else if (this.startsWith('<![CDATA[')) {
        element.children.push(this.parseDelimitedNode('cdata', '<![CDATA[', ']]>'))
      }
      else if (this.startsWith('<?')) {
        element.children.push(this.parseProcessingInstruction())
      }
      else if (this.startsWith('<!')) {
        this.fail(
          'ODX_METADATA_XML_DECLARATION_FORBIDDEN',
          'Unsupported XML declaration inside CSDL.',
          this.offset,
          this.offset + 2,
        )
      }
      else if (this.startsWith('<')) {
        element.children.push(this.parseElement(namespaces, depth + 1))
      }
      else {
        element.children.push(this.parseText())
      }
    }

    this.fail('ODX_METADATA_XML_UNCLOSED_ELEMENT', `Element <${rawName}> is not closed.`, start, this.offset)
  }

  private parseText(): CsdlXmlNode {
    const start = this.offset
    const end = this.input.indexOf('<', start)
    this.offset = end === -1 ? this.input.length : end
    const raw = this.input.slice(start, this.offset)
    return {
      kind: 'text',
      id: '',
      value: this.decodeEntities(raw, start),
      provenance: this.locator.provenance(start, this.offset),
    }
  }

  private parseDelimitedNode(kind: 'comment' | 'cdata', open: string, close: string): CsdlXmlNode {
    const start = this.offset
    this.offset += open.length
    const end = this.input.indexOf(close, this.offset)
    if (end === -1)
      this.fail('ODX_METADATA_XML_UNTERMINATED_NODE', `Unterminated XML ${kind}.`, start, this.input.length)
    const value = this.input.slice(this.offset, end)
    this.offset = end + close.length
    return {
      kind,
      id: '',
      value,
      provenance: this.locator.provenance(start, this.offset),
    }
  }

  private parseProcessingInstruction(): CsdlXmlNode {
    const start = this.offset
    this.offset += 2
    const target = this.readName()
    const end = this.input.indexOf('?>', this.offset)
    if (end === -1)
      this.fail('ODX_METADATA_XML_UNTERMINATED_PI', 'Unterminated processing instruction.', start, this.input.length)
    const value = this.input.slice(this.offset, end).trim()
    this.offset = end + 2
    return {
      kind: 'processing-instruction',
      id: '',
      target,
      value,
      provenance: this.locator.provenance(start, this.offset),
    }
  }

  private readAttribute(): RawAttribute {
    const start = this.offset
    const name = this.readName()
    this.skipWhitespace()
    this.expect('=')
    this.skipWhitespace()
    const quote = this.input[this.offset]
    if (quote !== '"' && quote !== '\'')
      this.fail('ODX_METADATA_XML_ATTRIBUTE_QUOTE', `Attribute ${name} must use quotes.`, start, this.offset + 1)
    this.offset++
    const valueStart = this.offset
    const valueEnd = this.input.indexOf(quote, valueStart)
    if (valueEnd === -1)
      this.fail('ODX_METADATA_XML_UNTERMINATED_ATTRIBUTE', `Attribute ${name} is not closed.`, start, this.input.length)
    const rawValue = this.input.slice(valueStart, valueEnd)
    this.offset = valueEnd + 1
    return {
      name,
      rawValue,
      value: this.decodeEntities(rawValue, valueStart),
      start,
      end: this.offset,
    }
  }

  private readName(): string {
    const start = this.offset
    while (this.offset < this.input.length && !XML_NAME_TERMINATOR_REGEX.test(this.input[this.offset]!))
      this.offset++
    const name = this.input.slice(start, this.offset)
    if (!XML_NAME_REGEX.test(name))
      this.fail('ODX_METADATA_XML_INVALID_NAME', 'Invalid or missing XML name.', start, this.offset)
    return name
  }

  private decodeEntities(raw: string, sourceOffset: number): string {
    const unsupported = raw.match(XML_UNSUPPORTED_ENTITY_REGEX)
    if (unsupported) {
      const start = sourceOffset + (unsupported.index || 0)
      this.fail('ODX_METADATA_XML_UNKNOWN_ENTITY', 'Unknown or malformed XML entity reference.', start, start + unsupported[0].length)
    }
    return raw.replace(ENTITY_REFERENCE_REGEX, (entity, value: string, index: number) => {
      if (value === 'amp')
        return '&'
      if (value === 'lt')
        return '<'
      if (value === 'gt')
        return '>'
      if (value === 'quot')
        return '"'
      if (value === 'apos')
        return '\''
      const codePoint = value.startsWith('#x')
        ? Number.parseInt(value.slice(2), 16)
        : Number.parseInt(value.slice(1), 10)
      const validXmlCodePoint = codePoint === 0x9
        || codePoint === 0xA
        || codePoint === 0xD
        || (codePoint >= 0x20 && codePoint <= 0xD7FF)
        || (codePoint >= 0xE000 && codePoint <= 0xFFFD)
        || (codePoint >= 0x10000 && codePoint <= 0x10FFFF)
      if (!Number.isSafeInteger(codePoint) || !validXmlCodePoint) {
        this.fail(
          'ODX_METADATA_XML_INVALID_ENTITY',
          `Invalid numeric XML entity &${value};.`,
          sourceOffset + index,
          sourceOffset + index + entity.length,
        )
      }
      return String.fromCodePoint(codePoint)
    })
  }

  private skipDocumentTrivia(): void {
    while (true) {
      this.skipWhitespace()
      if (this.startsWith('<?'))
        this.parseProcessingInstruction()
      else if (this.startsWith('<!--'))
        this.parseDelimitedNode('comment', '<!--', '-->')
      else
        return
    }
  }

  private skipWhitespace(): void {
    while (XML_WHITESPACE_REGEX.test(this.input[this.offset] || ''))
      this.offset++
  }

  private startsWith(value: string): boolean {
    return this.input.startsWith(value, this.offset)
  }

  private expect(value: string): void {
    if (!this.startsWith(value))
      this.fail('ODX_METADATA_XML_EXPECTED_TOKEN', `Expected "${value}".`, this.offset, this.offset + value.length)
    this.offset += value.length
  }

  private fail(code: string, message: string, start: number, end: number): never {
    this.diagnostics.push(diagnostic(code, 'error', message, this.locator.provenance(start, end)))
    throw new XmlParseFailure(message)
  }
}

export function parseCsdlXml(input: string, options: CsdlParseOptions = {}): CsdlParseResult {
  if (typeof input !== 'string')
    throw new TypeError('CSDL XML input must be a string')
  return new XmlParser(input, options).parse()
}
