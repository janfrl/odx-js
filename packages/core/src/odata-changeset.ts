export type ODataChangeSetMethod = 'DELETE' | 'MERGE' | 'PATCH' | 'POST' | 'PUT'

export interface ODataChangeSetRequest {
  readonly method: ODataChangeSetMethod
  readonly path: string
  readonly headers?: Readonly<Record<string, string>>
  /** JSON value, or raw bytes with an explicit Content-Type header. */
  readonly body?: unknown
}

export interface ODataChangeSetPayload {
  readonly body: string | Uint8Array
  readonly contentType: string
  readonly batchBoundary: string
  readonly changeSetBoundary: string
  readonly contentIds: readonly string[]
}

export interface ODataBatchChangeSetsPayload {
  readonly body: string | Uint8Array
  readonly contentType: string
  readonly batchBoundary: string
  readonly changeSetBoundaries: readonly string[]
  readonly contentIds: readonly (readonly string[])[]
}

/** One safe service-relative GET operation inside an OData batch. */
export interface ODataBatchReadRequest {
  readonly path: string
  readonly headers?: Readonly<Record<string, string>>
}

export interface ODataBatchReadsPayload {
  readonly body: string
  readonly contentType: string
  readonly batchBoundary: string
}

export interface ODataChangeSetResponse {
  /** MIME request identifier, distinct from the embedded HTTP response headers. */
  readonly contentId?: string
  readonly status: number
  readonly headers: Readonly<Record<string, string>>
  readonly body?: unknown
}

export interface ODataBatchChangeSetResult {
  readonly succeeded: boolean
  readonly responses: readonly ODataChangeSetResponse[]
}

export interface SerializeODataChangeSetOptions {
  readonly batchBoundary?: string
  readonly changeSetBoundary?: string
}

export interface SerializeODataBatchChangeSetsOptions {
  readonly batchBoundary?: string
  readonly changeSetBoundaries?: readonly string[]
}

export interface SerializeODataBatchReadsOptions {
  readonly batchBoundary?: string
}

const RE_BOUNDARY = /^[\w'()+,./:=?-]{1,70}$/u
const RE_CONTROL = /[\r\n]/u
const RE_CONTENT_TYPE_BOUNDARY = /boundary=(?:"([^"]+)"|([^;\s]+))/iu
const RE_HTTP_RESPONSE = /^HTTP\/1\.[01]\s+(\d{3})(?:\s+(?:\S.*)?)?$/mu
const RE_LEADING_LINE_BREAK = /^\r?\n/u
const RE_REGEXP_META = /[.*+?^${}()|[\]\\]/gu
const RE_LINE_BREAK = /\r?\n/u
const RE_HEADER_SEPARATOR = /\r?\n\r?\n/u
const RE_MULTIPART_MIXED = /^multipart\/mixed(?:\s*;|\s*$)/iu
const RE_APPLICATION_HTTP = /^application\/http(?:\s*;|\s*$)/iu

export class ODataChangeSetError extends Error {
  readonly code: string
  readonly responses: readonly ODataChangeSetResponse[]

  constructor(
    code: string,
    message: string,
    responses: readonly ODataChangeSetResponse[] = [],
  ) {
    super(message)
    this.name = 'ODataChangeSetError'
    this.code = code
    this.responses = Object.freeze([...responses])
  }
}

function randomBoundary(prefix: string): string {
  const bytes = new Uint8Array(12)
  globalThis.crypto.getRandomValues(bytes)
  return `${prefix}_${Array.from(bytes, value => value.toString(16).padStart(2, '0')).join('')}`
}

function validBoundary(value: string, label: string): string {
  if (!RE_BOUNDARY.test(value) || RE_CONTROL.test(value)) {
    throw new ODataChangeSetError(
      'core.changeset.invalid-boundary',
      `${label} is not a valid MIME boundary.`,
    )
  }
  return value
}

function isSafeServiceRelativePath(path: string): boolean {
  if (path.length === 0
    || path.startsWith('/')
    || path.includes('://')
    || path.includes('\\')
    || path.includes('#')
    || RE_CONTROL.test(path)) {
    return false
  }
  const queryIndex = path.indexOf('?')
  if (queryIndex === path.length - 1)
    return false
  const resourcePath = queryIndex < 0 ? path : path.slice(0, queryIndex)
  const segments = resourcePath.split('/')
  if (segments.some(segment => segment.length === 0))
    return false
  return segments.every((segment) => {
    let decoded: string
    try {
      decoded = decodeURIComponent(segment)
    }
    catch {
      return false
    }
    return !decoded
      .replaceAll('\\', '/')
      .split('/')
      .some(part => part === '.' || part === '..')
  })
}

function validateRequest(request: ODataChangeSetRequest): void {
  if (!isSafeServiceRelativePath(request.path)) {
    throw new ODataChangeSetError(
      'core.changeset.invalid-path',
      'A changeset operation requires a safe service-relative path.',
    )
  }
  for (const [name, value] of Object.entries(request.headers ?? {})) {
    if (name.length === 0 || RE_CONTROL.test(name) || RE_CONTROL.test(value)) {
      throw new ODataChangeSetError(
        'core.changeset.invalid-header',
        'Changeset operation headers must not contain control characters.',
      )
    }
  }
  const binaryContentType = isBinaryBody(request.body)
    ? findHeader(request.headers, 'content-type')
    : undefined
  if (isBinaryBody(request.body)
    && (binaryContentType === undefined || binaryContentType.trim().length === 0)) {
    throw new ODataChangeSetError(
      'core.changeset.missing-binary-content-type',
      'A binary changeset operation requires an explicit Content-Type header.',
    )
  }
}

function validateReadRequest(request: ODataBatchReadRequest): void {
  if (!isSafeServiceRelativePath(request.path)) {
    throw new ODataChangeSetError(
      'core.batch-reads.invalid-path',
      'An OData batch read requires a safe service-relative path.',
    )
  }
  for (const [name, value] of Object.entries(request.headers ?? {})) {
    if (name.length === 0 || RE_CONTROL.test(name) || RE_CONTROL.test(value)) {
      throw new ODataChangeSetError(
        'core.batch-reads.invalid-header',
        'OData batch read headers must not contain control characters.',
      )
    }
  }
}

function isBinaryBody(value: unknown): value is ArrayBuffer | Uint8Array {
  return value instanceof ArrayBuffer || value instanceof Uint8Array
}

function findHeader(
  headers: Readonly<Record<string, string>> | undefined,
  name: string,
): string | undefined {
  const normalizedName = name.toLowerCase()
  return Object.entries(headers ?? {}).find(([header]) =>
    header.toLowerCase() === normalizedName)?.[1]
}

const textEncoder = new TextEncoder()

function byteBody(value: ArrayBuffer | Uint8Array): Uint8Array {
  return value instanceof Uint8Array
    ? value
    : new Uint8Array(value)
}

function joinBytes(parts: readonly (string | Uint8Array)[], separator = ''): Uint8Array {
  const separatorBytes = textEncoder.encode(separator)
  const encoded = parts.map(part => typeof part === 'string' ? textEncoder.encode(part) : part)
  const size = encoded.reduce((total, part) => total + part.byteLength, 0)
    + Math.max(0, encoded.length - 1) * separatorBytes.byteLength
  const result = new Uint8Array(size)
  let offset = 0
  encoded.forEach((part, index) => {
    if (index > 0) {
      result.set(separatorBytes, offset)
      offset += separatorBytes.byteLength
    }
    result.set(part, offset)
    offset += part.byteLength
  })
  return result
}

function includesBytes(value: Uint8Array, candidate: Uint8Array): boolean {
  if (candidate.length === 0)
    return true
  const lastOffset = value.length - candidate.length
  for (let offset = 0; offset <= lastOffset; offset++) {
    if (value[offset] !== candidate[0])
      continue
    let matches = true
    for (let index = 1; index < candidate.length; index++) {
      if (value[offset + index] !== candidate[index]) {
        matches = false
        break
      }
    }
    if (matches)
      return true
  }
  return false
}

function validateBinaryBoundary(
  request: ODataChangeSetRequest,
  boundary: string,
): void {
  if (!isBinaryBody(request.body))
    return
  const body = byteBody(request.body)
  const marker = textEncoder.encode(`--${boundary}`)
  if (includesBytes(body.subarray(0, marker.length), marker)
    || includesBytes(body, textEncoder.encode(`\r\n--${boundary}`))) {
    throw new ODataChangeSetError(
      'core.changeset.binary-boundary-collision',
      'A binary changeset body must not contain a MIME boundary at the start of a line.',
    )
  }
}

function serializeBody(parts: readonly (string | Uint8Array)[]): string | Uint8Array {
  return parts.every(part => typeof part === 'string')
    ? (parts as readonly string[]).join('\r\n')
    : joinBytes(parts, '\r\n')
}

function operationPart(
  request: ODataChangeSetRequest,
  boundary: string,
  contentId: number,
): string | Uint8Array {
  const binary = isBinaryBody(request.body)
  const headers = {
    Accept: 'application/json',
    ...(request.body === undefined || binary ? {} : { 'Content-Type': 'application/json' }),
    ...request.headers,
  }
  const prefix = [
    `--${boundary}`,
    'Content-Type: application/http',
    'Content-Transfer-Encoding: binary',
    `Content-ID: ${contentId}`,
    '',
    `${request.method} ${request.path} HTTP/1.1`,
    ...Object.entries(headers).map(([name, value]) => `${name}: ${value}`),
    '',
    '',
  ].join('\r\n')
  if (binary) {
    validateBinaryBoundary(request, boundary)
    return joinBytes([prefix, byteBody(request.body)])
  }
  return request.body === undefined
    ? prefix.slice(0, -2)
    : `${prefix}${JSON.stringify(request.body)}`
}

function readPart(
  request: ODataBatchReadRequest,
  boundary: string,
): string {
  const headers = {
    Accept: 'application/json',
    ...request.headers,
  }
  return [
    `--${boundary}`,
    'Content-Type: application/http',
    'Content-Transfer-Encoding: binary',
    '',
    `GET ${request.path} HTTP/1.1`,
    ...Object.entries(headers).map(([name, value]) => `${name}: ${value}`),
    '',
  ].join('\r\n')
}

/** Serializes independent, side-effect-free GET operations into one OData batch. */
export function serializeODataBatchReads(
  requests: readonly ODataBatchReadRequest[],
  options: SerializeODataBatchReadsOptions = {},
): ODataBatchReadsPayload {
  if (requests.length === 0) {
    throw new ODataChangeSetError(
      'core.batch-reads.empty',
      'An OData read batch requires at least one operation.',
    )
  }
  requests.forEach(validateReadRequest)
  const batchBoundary = validBoundary(
    options.batchBoundary ?? randomBoundary('batch'),
    'Batch boundary',
  )
  const body = [
    ...requests.map(request => readPart(request, batchBoundary)),
    `--${batchBoundary}--`,
    '',
  ].join('\r\n')
  return Object.freeze({
    body,
    contentType: `multipart/mixed; boundary=${batchBoundary}`,
    batchBoundary,
  })
}

export function serializeODataChangeSet(
  requests: readonly ODataChangeSetRequest[],
  options: SerializeODataChangeSetOptions = {},
): ODataChangeSetPayload {
  if (requests.length === 0) {
    throw new ODataChangeSetError(
      'core.changeset.empty',
      'An OData changeset requires at least one operation.',
    )
  }
  requests.forEach(validateRequest)
  const batchBoundary = validBoundary(
    options.batchBoundary ?? randomBoundary('batch'),
    'Batch boundary',
  )
  const changeSetBoundary = validBoundary(
    options.changeSetBoundary ?? randomBoundary('changeset'),
    'Changeset boundary',
  )
  if (batchBoundary === changeSetBoundary) {
    throw new ODataChangeSetError(
      'core.changeset.duplicate-boundary',
      'Batch and changeset boundaries must differ.',
    )
  }
  requests.forEach(request => validateBinaryBoundary(request, batchBoundary))
  const operationParts = requests.map((request, index) =>
    operationPart(request, changeSetBoundary, index + 1),
  )
  const body = serializeBody([
    `--${batchBoundary}`,
    `Content-Type: multipart/mixed; boundary=${changeSetBoundary}`,
    '',
    ...operationParts,
    `--${changeSetBoundary}--`,
    `--${batchBoundary}--`,
    '',
  ])
  return Object.freeze({
    body,
    contentType: `multipart/mixed; boundary=${batchBoundary}`,
    batchBoundary,
    changeSetBoundary,
    contentIds: Object.freeze(requests.map((_, index) => String(index + 1))),
  })
}

/** Serializes independent changesets into one OData batch request. */
export function serializeODataBatchChangeSets(
  changeSets: readonly (readonly ODataChangeSetRequest[])[],
  options: SerializeODataBatchChangeSetsOptions = {},
): ODataBatchChangeSetsPayload {
  if (changeSets.length === 0) {
    throw new ODataChangeSetError(
      'core.batch-changesets.empty',
      'An OData changeset batch requires at least one changeset.',
    )
  }
  if (changeSets.some(changeSet => changeSet.length === 0)) {
    throw new ODataChangeSetError(
      'core.batch-changesets.empty-changeset',
      'Every changeset in an OData batch requires at least one operation.',
    )
  }
  changeSets.flat().forEach(validateRequest)
  const batchBoundary = validBoundary(
    options.batchBoundary ?? randomBoundary('batch'),
    'Batch boundary',
  )
  if (options.changeSetBoundaries !== undefined
    && options.changeSetBoundaries.length !== changeSets.length) {
    throw new ODataChangeSetError(
      'core.batch-changesets.boundary-count',
      'The changeset boundary count must match the changeset count.',
    )
  }
  const changeSetBoundaries = Object.freeze(changeSets.map((_, index) =>
    validBoundary(
      options.changeSetBoundaries?.[index] ?? randomBoundary('changeset'),
      `Changeset ${index + 1} boundary`,
    ),
  ))
  if (new Set([batchBoundary, ...changeSetBoundaries]).size
    !== changeSetBoundaries.length + 1) {
    throw new ODataChangeSetError(
      'core.batch-changesets.duplicate-boundary',
      'Batch and changeset boundaries must be unique.',
    )
  }
  changeSets.flat().forEach(request => validateBinaryBoundary(request, batchBoundary))

  let contentId = 0
  const contentIds = Object.freeze(changeSets.map(changeSet =>
    Object.freeze(changeSet.map(() => String(++contentId))),
  ))
  contentId = 0
  const body = serializeBody([
    ...changeSets.flatMap((changeSet, groupIndex) => {
      const boundary = changeSetBoundaries[groupIndex]!
      return [
        `--${batchBoundary}`,
        `Content-Type: multipart/mixed; boundary=${boundary}`,
        '',
        ...changeSet.map(request => operationPart(
          request,
          boundary,
          ++contentId,
        )),
        `--${boundary}--`,
      ]
    }),
    `--${batchBoundary}--`,
    '',
  ])
  return Object.freeze({
    body,
    contentType: `multipart/mixed; boundary=${batchBoundary}`,
    batchBoundary,
    changeSetBoundaries,
    contentIds,
  })
}

function boundaryFromContentType(contentType: string): string {
  if (!RE_MULTIPART_MIXED.test(contentType.trim())) {
    throw new ODataChangeSetError(
      'core.changeset.invalid-response-content-type',
      'An OData batch response envelope must use multipart/mixed.',
    )
  }
  const match = RE_CONTENT_TYPE_BOUNDARY.exec(contentType)
  const value = match?.[1] ?? match?.[2]
  if (value === undefined) {
    throw new ODataChangeSetError(
      'core.changeset.missing-response-boundary',
      'The OData batch response does not declare a MIME boundary.',
    )
  }
  return validBoundary(value, 'Response boundary')
}

function splitParts(body: string, boundary: string): readonly string[] {
  // RFC 2046 §5.1.1: delimiters own their preceding line break. Boundary text
  // inside a payload is not framing; preamble and epilogue are not operations.
  const escaped = boundary.replace(RE_REGEXP_META, '\\$&')
  const delimiter = new RegExp(`(?:^|\\r?\\n)--${escaped}(--)?[\\t ]*(?=\\r?\\n|$)`, 'gu')
  const parts: string[] = []
  let start: number | undefined
  for (const match of body.matchAll(delimiter)) {
    if (start !== undefined)
      parts.push(body.slice(start, match.index))
    if (match[1] === '--')
      return parts
    const end = match.index + match[0].length
    start = end + (body.startsWith('\r\n', end) ? 2 : body[end] === '\n' ? 1 : 0)
  }
  throw new ODataChangeSetError(
    'core.changeset.incomplete-response',
    'The OData batch response is missing a closing MIME boundary.',
  )
}

function parseHeaders(block: string): Readonly<Record<string, string>> {
  return Object.freeze(Object.fromEntries(block.split(RE_LINE_BREAK).flatMap((line) => {
    const index = line.indexOf(':')
    return index < 1
      ? []
      : [[line.slice(0, index).trim().toLowerCase(), line.slice(index + 1).trim()]]
  })))
}

function invalidResponsePart(): ODataChangeSetError {
  return new ODataChangeSetError(
    'core.changeset.invalid-response-part',
    'An OData batch response part is empty, malformed, or has an unsupported MIME type.',
  )
}

function parseMimePart(part: string): { contentType: string, content: string, contentId?: string } {
  const separator = RE_HEADER_SEPARATOR.exec(part)
  if (separator === null)
    throw invalidResponsePart()
  const headerBlock = part.slice(0, separator.index)
  const identityHeaders = headerBlock.split(RE_LINE_BREAK).filter(line =>
    line.slice(0, line.indexOf(':')).trim().toLowerCase() === 'content-id',
  )
  if (identityHeaders.length > 1)
    throw invalidResponsePart()
  const headers = parseHeaders(headerBlock)
  return {
    contentType: headers['content-type'] ?? '',
    content: part.slice(separator.index + separator[0].length),
    ...(headers['content-id'] === undefined ? {} : { contentId: headers['content-id'] }),
  }
}

function parseHttpMimePart(part: string): ODataChangeSetResponse {
  const { contentType, content, contentId } = parseMimePart(part)
  if (!RE_APPLICATION_HTTP.test(contentType))
    throw invalidResponsePart()
  return parseHttpPart(content, contentId)
}

function parseHttpPart(part: string, contentId?: string): ODataChangeSetResponse {
  const response = RE_HTTP_RESPONSE.exec(part)
  if (response?.index !== 0) {
    throw new ODataChangeSetError(
      'core.changeset.invalid-response',
      'A changeset response part does not contain an HTTP status line.',
    )
  }
  const status = Number(response[1])
  const afterStatus = part.slice(response.index + response[0].length)
    .replace(RE_LEADING_LINE_BREAK, '')
  const separator = RE_HEADER_SEPARATOR.exec(afterStatus)
  const headerBlock = separator === null
    ? afterStatus
    : afterStatus.slice(0, separator.index)
  const payload = separator === null
    ? ''
    : afterStatus.slice(separator.index + separator[0].length).trim()
  const headers = parseHeaders(headerBlock)
  let parsedBody: unknown
  if (payload.length > 0) {
    try {
      parsedBody = JSON.parse(payload)
    }
    catch {
      parsedBody = payload
    }
  }
  return Object.freeze({
    status,
    headers,
    ...(contentId === undefined ? {} : { contentId }),
    ...(parsedBody === undefined ? {} : { body: parsedBody }),
  })
}

export function parseODataChangeSetResponse(
  body: string,
  contentType: string,
): readonly ODataChangeSetResponse[] {
  const results = parseODataBatchChangeSetsResponse(body, contentType)
  if (results.length !== 1) {
    throw new ODataChangeSetError(
      'core.changeset.response-count-mismatch',
      'An atomic OData response must contain exactly one changeset result.',
    )
  }
  const { responses, succeeded } = results[0]!
  if (!succeeded) {
    throw new ODataChangeSetError(
      'core.changeset.failed',
      'The atomic OData changeset failed.',
      responses,
    )
  }
  return responses
}

/** Parses every independent changeset result without collapsing partial failures. */
export function parseODataBatchChangeSetsResponse(
  body: string,
  contentType: string,
): readonly ODataBatchChangeSetResult[] {
  const batchBoundary = boundaryFromContentType(contentType)
  const batchParts = splitParts(body, batchBoundary)
  const results: ODataBatchChangeSetResult[] = []
  for (const batchPart of batchParts) {
    const { contentType: nestedType, content, contentId } = parseMimePart(batchPart)
    const responses: ODataChangeSetResponse[] = []
    if (RE_MULTIPART_MIXED.test(nestedType)) {
      const changeSetBoundary = boundaryFromContentType(nestedType)
      for (const part of splitParts(content, changeSetBoundary))
        responses.push(parseHttpMimePart(part))
    }
    else if (RE_APPLICATION_HTTP.test(nestedType)) {
      responses.push(parseHttpPart(content, contentId))
    }
    if (responses.length === 0)
      throw invalidResponsePart()
    if (responses.some(response => response.status === 202)) {
      throw new ODataChangeSetError(
        'core.changeset.pending-response',
        'The OData batch contains a pending asynchronous result, not a completed mutation outcome.',
        responses,
      )
    }
    results.push(Object.freeze({
      succeeded: responses.every(response =>
        response.status >= 200 && response.status < 300,
      ),
      responses: Object.freeze(responses),
    }))
  }
  if (results.length === 0) {
    throw new ODataChangeSetError(
      'core.changeset.empty-response',
      'The OData batch response does not contain changeset results.',
    )
  }
  return Object.freeze(results)
}

/** Parses top-level application/http results from a read-only OData batch. */
export function parseODataBatchReadsResponse(
  body: string,
  contentType: string,
): readonly ODataChangeSetResponse[] {
  const batchBoundary = boundaryFromContentType(contentType)
  const responses: ODataChangeSetResponse[] = []
  for (const batchPart of splitParts(body, batchBoundary)) {
    const { contentType: nestedType, content, contentId } = parseMimePart(batchPart)
    if (RE_MULTIPART_MIXED.test(nestedType)) {
      throw new ODataChangeSetError(
        'core.batch-reads.nested-changeset',
        'A read-only OData batch response must not contain a nested changeset.',
      )
    }
    if (!RE_APPLICATION_HTTP.test(nestedType))
      throw invalidResponsePart()
    responses.push(parseHttpPart(content, contentId))
  }
  if (responses.length === 0) {
    throw new ODataChangeSetError(
      'core.batch-reads.empty-response',
      'The OData batch response does not contain read results.',
    )
  }
  return Object.freeze(responses)
}

/** Correlates successful results with serialized request IDs; ID-less legacy responses retain wire order. */
export function correlateODataChangeSetResponses(
  responses: readonly ODataChangeSetResponse[],
  contentIds: readonly string[],
): readonly ODataChangeSetResponse[] {
  const expectedIds = new Set(contentIds)
  if (responses.length !== contentIds.length || contentIds.length === 0
    || expectedIds.size !== contentIds.length
    || contentIds.some(id => id.length === 0)) {
    throw new ODataChangeSetError(
      'core.changeset.response-count-mismatch',
      'The OData changeset response count or request identifiers are invalid.',
    )
  }
  if (responses.every(response => response.contentId === undefined))
    return Object.freeze([...responses])
  const byId = new Map<string, ODataChangeSetResponse>()
  for (const response of responses) {
    if (response.contentId === undefined || !expectedIds.has(response.contentId)
      || byId.has(response.contentId)) {
      throw new ODataChangeSetError(
        'core.changeset.response-id-mismatch',
        'The OData changeset response identifiers are missing, duplicate, or unexpected.',
      )
    }
    byId.set(response.contentId, response)
  }
  return Object.freeze(contentIds.map(id => byId.get(id)!))
}

/** Correlates successful sibling groups without changing their independent failure outcomes. */
export function correlateODataBatchChangeSetResponses(
  results: readonly ODataBatchChangeSetResult[],
  contentIds: readonly (readonly string[])[],
): readonly ODataBatchChangeSetResult[] {
  const allIds = contentIds.flat()
  if (results.length !== contentIds.length || contentIds.length === 0
    || contentIds.some(ids => ids.length === 0)
    || allIds.some(id => id.length === 0)
    || new Set(allIds).size !== allIds.length) {
    throw new ODataChangeSetError(
      'core.changeset.response-count-mismatch',
      'The OData batch response count does not match the requested changesets.',
    )
  }
  return Object.freeze(results.map((result, index) => result.succeeded
    ? Object.freeze({
        ...result,
        responses: correlateODataChangeSetResponses(result.responses, contentIds[index]!),
      })
    : result))
}
