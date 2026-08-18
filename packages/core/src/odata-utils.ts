import type { ODataCollectionPage } from './types'

const RE_ODATA_COUNT = /^(?:0|[1-9]\d*)$/
const MAX_CONTINUATION_TOKEN_LENGTH = 8192

/**
 * Recursive flattener for OData V2/V4 structures and removes metadata.
 * Preserves count information if present.
 *
 * @param data The data to flatten
 * @param depth Current recursion depth
 * @param maxDepth Maximum recursion depth (default 10)
 */
export function flattenOData(data: any, depth = 0, maxDepth = 10): any {
  if (depth > maxDepth)
    return '[Max Depth Reached]'

  if (!data || typeof data !== 'object') {
    return data
  }

  // Handle Binary Data (Buffers, Uint8Arrays)
  if (data instanceof Uint8Array || (typeof data === 'object' && data.constructor && data.constructor.name === 'Buffer')) {
    return `[Binary Data, ${data.length} bytes]`
  }

  // 1. Handle OData V2 'd' envelope (recursive to catch d.results or d.value)
  if (isODataV2Envelope(data)) {
    return flattenOData(data.d, depth + 1, maxDepth)
  }

  // 2. Handle OData Results (V2 results or V4 value)
  const results = Array.isArray(data.results)
    ? data.results
    : Array.isArray(data.value)
      ? data.value
      : undefined
  if (results) {
    const totalCount = normalizeODataCount(readODataCollectionCount(data))
    const flattened = results.map((item: any) => flattenOData(item, depth + 1, maxDepth))
    if (totalCount !== undefined) {
      (flattened as any).totalCount = totalCount
    }
    return flattened
  }

  // 3. Handle plain Arrays
  if (Array.isArray(data)) {
    return data.map(item => flattenOData(item, depth + 1, maxDepth))
  }

  // 4. Handle Objects (stripping metadata)
  const flattened: any = {}
  let hasProperties = false
  for (const key in data) {
    if (key === '__metadata' || key === '__deferred' || key === 'results')
      continue

    const value = flattenOData(data[key], depth + 1, maxDepth)
    // OData minimal-metadata responses advertise an available bound operation
    // with an empty object. Preserve that object so consumers can distinguish
    // it from the explicit null advertisement used for an unavailable
    // operation. Ordinary empty objects retain the historical null projection.
    flattened[key] = key.startsWith('#') && value === null && isEmptyObject(data[key])
      ? {}
      : value
    hasProperties = true
  }

  // If we have no properties left after stripping (but we HAD an object), return null
  // This helps represents stripped metadata objects as null.
  return hasProperties ? flattened : null
}

function isEmptyObject(value: unknown): value is Record<string, never> {
  return typeof value === 'object'
    && value !== null
    && !Array.isArray(value)
    && Object.keys(value).length === 0
}

/**
 * Flattens an OData collection into an explicit page object. The explicit
 * `totalCount` field is serializable across Nuxt SSR payload boundaries,
 * unlike custom properties attached directly to arrays.
 */
export function toODataCollectionPage<T>(data: unknown): ODataCollectionPage<T> {
  const continuation = readODataContinuation(data)
  const sourceCount = Array.isArray(data) && Object.hasOwn(data, 'totalCount')
    ? (data as T[] & { totalCount?: unknown }).totalCount
    : undefined
  const flattened = flattenOData(data)
  if (!Array.isArray(flattened)) {
    throw new TypeError('Expected an OData collection response.')
  }

  const count = sourceCount ?? (flattened as T[] & { totalCount?: unknown }).totalCount
  const items = Array.from(flattened) as T[]
  const totalCount = normalizeODataCount(count)
  if (totalCount === undefined) {
    return { items, ...(continuation ? { continuation } : {}) }
  }
  return { items, totalCount, ...(continuation ? { continuation } : {}) }
}

function readODataContinuation(data: unknown): { token: string } | undefined {
  if (!data || typeof data !== 'object' || Array.isArray(data))
    return undefined

  const record = data as Record<string, unknown>
  const envelope = isODataV2Envelope(record) ? record.d : record
  if (!envelope || typeof envelope !== 'object' || Array.isArray(envelope))
    return undefined

  const collection = envelope as Record<string, unknown>
  const nextLink = Object.hasOwn(collection, '__next')
    ? collection.__next
    : collection['@odata.nextLink']
  if (nextLink === undefined)
    return undefined
  if (typeof nextLink !== 'string')
    throw new TypeError('Expected the OData continuation link to be a string.')

  const queryStart = nextLink.indexOf('?')
  if (queryStart < 0)
    throw new TypeError('Expected the OData continuation link to contain a query.')
  const fragmentStart = nextLink.indexOf('#', queryStart)
  const token = nextLink.slice(queryStart + 1, fragmentStart < 0 ? undefined : fragmentStart)
  return { token: validateODataContinuationToken(token) }
}

/** Anchors an opaque continuation to the caller-owned collection path. */
export function createODataContinuationPath(
  collectionPath: string,
  continuation: { readonly token: string },
): string {
  if (
    typeof collectionPath !== 'string'
    || collectionPath.length === 0
    || hasControlCharacter(collectionPath)
    || collectionPath.includes('?')
    || collectionPath.includes('#')
  ) {
    throw new TypeError('Expected a query-free OData collection path.')
  }
  return `${collectionPath}?${validateODataContinuationToken(continuation.token)}`
}

function validateODataContinuationToken(token: unknown): string {
  if (
    typeof token !== 'string'
    || token.length === 0
    || token.length > MAX_CONTINUATION_TOKEN_LENGTH
    || hasControlCharacter(token)
    || token.includes('#')
  ) {
    throw new TypeError('Expected a valid OData continuation token.')
  }

  const parameters = new URLSearchParams(token)
  let parameterCount = 0
  for (const key of parameters.keys()) {
    parameterCount += 1
    if (key.length === 0)
      throw new TypeError('Expected a valid OData continuation token.')
  }
  if (parameterCount === 0)
    throw new TypeError('Expected a valid OData continuation token.')
  return token
}

function hasControlCharacter(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index)
    if (code <= 0x1F || code === 0x7F)
      return true
  }
  return false
}

function readODataCollectionCount(data: Record<string, any>): unknown {
  for (const property of ['__count', '@odata.count', 'count']) {
    if (Object.hasOwn(data, property)) {
      return data[property]
    }
  }
  return undefined
}

function normalizeODataCount(count: unknown): number | undefined {
  if (count === undefined) {
    return undefined
  }
  if (typeof count === 'number') {
    if (Number.isSafeInteger(count) && count >= 0) {
      return count
    }
  }
  else if (typeof count === 'string' && RE_ODATA_COUNT.test(count)) {
    const parsed = Number(count)
    if (Number.isSafeInteger(parsed)) {
      return parsed
    }
  }
  throw new TypeError('Expected the OData collection count to be a non-negative safe integer.')
}

function isODataV2Envelope(data: Record<string, any>): boolean {
  return Object.hasOwn(data, 'd')
    && Object.keys(data).every(key => key === 'd' || key === '__metadata')
}

const RE_REDUNDANT_SLASHES = /([^:]\/)\/+/g
const RE_TRAILING_SLASH = /\/$/

/**
 * Sanitizes a base URL by removing redundant slashes and ensuring no trailing slash.
 */
export function sanitizeBaseURL(url: string): string {
  if (!url)
    return ''
  return url.replace(RE_REDUNDANT_SLASHES, '$1').replace(RE_TRAILING_SLASH, '')
}

/**
 * Merges multiple header initializers into a plain record.
 */
export function mergeHeaders(...headers: (HeadersInit | Record<string, any> | undefined)[]): Record<string, string> {
  const merged: Record<string, string> = {}
  for (const h of headers) {
    if (!h)
      continue
    if (h instanceof Headers) {
      h.forEach((value, key) => {
        merged[key.toLowerCase()] = value
      })
    }
    else if (Array.isArray(h)) {
      for (const [key, value] of h) {
        merged[key.toLowerCase()] = value
      }
    }
    else {
      for (const [key, value] of Object.entries(h)) {
        if (value !== undefined && value !== null) {
          merged[key.toLowerCase()] = String(value)
        }
      }
    }
  }
  return merged
}

/**
 * Stringifies an OData query object into a URL-compatible record.
 * Handles special OData parameters like $filter and $expand.
 * Arrays (e.g. for $select) are joined with commas.
 */
export function stringifyQuery(query: Record<string, any>): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null)
      continue
    if (Array.isArray(value)) {
      result[key] = value.join(',')
    }
    else {
      result[key] = String(value)
    }
  }
  return result
}
