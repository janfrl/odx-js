export type ODataChangeSetMethod = 'DELETE' | 'PATCH' | 'POST' | 'PUT'

export interface ODataChangeSetRequest {
  readonly method: ODataChangeSetMethod
  readonly path: string
  readonly headers?: Readonly<Record<string, string>>
  readonly body?: unknown
}

export interface ODataChangeSetPayload {
  readonly body: string
  readonly contentType: string
  readonly batchBoundary: string
  readonly changeSetBoundary: string
}

export interface ODataChangeSetResponse {
  readonly status: number
  readonly headers: Readonly<Record<string, string>>
  readonly body?: unknown
}

export interface SerializeODataChangeSetOptions {
  readonly batchBoundary?: string
  readonly changeSetBoundary?: string
}

const RE_BOUNDARY = /^[\w'()+,./:=?-]{1,70}$/u
const RE_CONTROL = /[\r\n]/u
const RE_CONTENT_TYPE_BOUNDARY = /boundary=(?:"([^"]+)"|([^;\s]+))/iu
const RE_HTTP_RESPONSE = /^HTTP\/1\.[01]\s+(\d{3})(?:\s+(?:\S.*)?)?$/mu
const RE_LEADING_LINE_BREAK = /^\r?\n/u
const RE_TRAILING_LINE_BREAK = /\r?\n$/u
const RE_LINE_BREAK = /\r?\n/u
const RE_HEADER_SEPARATOR = /\r?\n\r?\n/u
const RE_MULTIPART_MIXED = /multipart\/mixed/iu
const RE_APPLICATION_HTTP = /application\/http/iu

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

function validateRequest(request: ODataChangeSetRequest): void {
  if (request.path.length === 0
    || request.path.startsWith('/')
    || request.path.includes('://')
    || RE_CONTROL.test(request.path)) {
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
}

function operationPart(
  request: ODataChangeSetRequest,
  boundary: string,
  contentId: number,
): string {
  const headers = {
    Accept: 'application/json',
    ...(request.body === undefined ? {} : { 'Content-Type': 'application/json' }),
    ...request.headers,
  }
  return [
    `--${boundary}`,
    'Content-Type: application/http',
    'Content-Transfer-Encoding: binary',
    `Content-ID: ${contentId}`,
    '',
    `${request.method} ${request.path} HTTP/1.1`,
    ...Object.entries(headers).map(([name, value]) => `${name}: ${value}`),
    '',
    ...(request.body === undefined ? [] : [JSON.stringify(request.body)]),
  ].join('\r\n')
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
  const operationParts = requests.map((request, index) =>
    operationPart(request, changeSetBoundary, index + 1),
  )
  const body = [
    `--${batchBoundary}`,
    `Content-Type: multipart/mixed; boundary=${changeSetBoundary}`,
    '',
    ...operationParts,
    `--${changeSetBoundary}--`,
    `--${batchBoundary}--`,
    '',
  ].join('\r\n')
  return Object.freeze({
    body,
    contentType: `multipart/mixed; boundary=${batchBoundary}`,
    batchBoundary,
    changeSetBoundary,
  })
}

function boundaryFromContentType(contentType: string): string {
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
  return body.split(`--${boundary}`)
    .slice(1)
    .map(part => part.replace(RE_LEADING_LINE_BREAK, '').replace(RE_TRAILING_LINE_BREAK, ''))
    .filter(part => part.length > 0 && part !== '--')
}

function parseHeaders(block: string): Readonly<Record<string, string>> {
  return Object.freeze(Object.fromEntries(block.split(RE_LINE_BREAK).flatMap((line) => {
    const index = line.indexOf(':')
    return index < 1
      ? []
      : [[line.slice(0, index).trim().toLowerCase(), line.slice(index + 1).trim()]]
  })))
}

function parseHttpPart(part: string): ODataChangeSetResponse {
  const response = RE_HTTP_RESPONSE.exec(part)
  if (response?.index === undefined) {
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
    ...(parsedBody === undefined ? {} : { body: parsedBody }),
  })
}

export function parseODataChangeSetResponse(
  body: string,
  contentType: string,
): readonly ODataChangeSetResponse[] {
  const batchBoundary = boundaryFromContentType(contentType)
  const batchParts = splitParts(body, batchBoundary)
  const responses: ODataChangeSetResponse[] = []
  for (const batchPart of batchParts) {
    const headerSeparator = RE_HEADER_SEPARATOR.exec(batchPart)
    if (headerSeparator === null)
      continue
    const mimeHeaders = parseHeaders(batchPart.slice(0, headerSeparator.index))
    const content = batchPart.slice(headerSeparator.index + headerSeparator[0].length)
    const nestedType = mimeHeaders['content-type'] ?? ''
    if (RE_MULTIPART_MIXED.test(nestedType)) {
      const changeSetBoundary = boundaryFromContentType(nestedType)
      for (const part of splitParts(content, changeSetBoundary))
        responses.push(parseHttpPart(part))
    }
    else if (RE_APPLICATION_HTTP.test(nestedType)) {
      responses.push(parseHttpPart(content))
    }
  }
  if (responses.length === 0) {
    throw new ODataChangeSetError(
      'core.changeset.empty-response',
      'The OData batch response does not contain changeset results.',
    )
  }
  if (responses.some(response => response.status < 200 || response.status >= 300)) {
    throw new ODataChangeSetError(
      'core.changeset.failed',
      'The atomic OData changeset failed.',
      responses,
    )
  }
  return Object.freeze(responses)
}
