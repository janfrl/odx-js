import type { H3Event } from 'h3'
import { getRequestURL } from 'h3'
import { normalizeODataServiceRoute } from './service-route'

const RE_TRAILING_SLASH = /\/$/
const RE_TRAILING_SLASHES = /\/+$/
const RE_LEADING_SLASHES = /^\/+/
const RE_DOUBLE_SLASHES = /([^:]\/)\/+/g
const RE_SINGLE_QUOTE = /'/g
const RE_WHITESPACE = /\s/u

function hasControlOrWhitespace(value: string): boolean {
  return [...value].some((character) => {
    const code = character.codePointAt(0)!
    return code <= 0x20 || code === 0x7F || RE_WHITESPACE.test(character)
  })
}

function hasControl(value: string): boolean {
  return [...value].some((character) => {
    const code = character.codePointAt(0)!
    return code < 0x20 || code === 0x7F
  })
}

function hasUnsafeResourceWhitespace(value: string): boolean {
  let insideStringLiteral = false

  for (let index = 0; index < value.length; index++) {
    const character = value[index]!
    const code = character.codePointAt(0)!

    if (code < 0x20 || code === 0x7F)
      return true

    if (character === '\'') {
      if (insideStringLiteral && value[index + 1] === '\'') {
        index++
        continue
      }
      insideStringLiteral = !insideStringLiteral
      continue
    }

    if (RE_WHITESPACE.test(character) && !insideStringLiteral)
      return true
  }

  return insideStringLiteral
}

function assertSafeODataResourcePath(value: string): void {
  const fail = (): never => {
    throw new TypeError(
      'ODX proxy request paths must remain service-relative without traversal, malformed encoding, backslashes, fragments, controls, unquoted whitespace, or empty segments.',
    )
  }
  if (value.length === 0)
    return
  if (value.startsWith('/')
    || value.endsWith('/')
    || value.includes('//')
    || value.includes('\\')
    || value.includes('?')
    || value.includes('#')
    || hasUnsafeResourceWhitespace(value)) {
    return fail()
  }
  for (const segment of value.split('/')) {
    let decoded: string
    try {
      decoded = decodeURIComponent(segment)
    }
    catch {
      return fail()
    }
    if (decoded.includes('\\') || hasControl(decoded) || hasUnsafeResourceWhitespace(decoded))
      return fail()
    if (decoded.split('/').some(part => part === '.' || part === '..'))
      return fail()
  }
}

/** Validates and normalizes the local route prefix owned by the ODX proxy. */
export function normalizeODataProxyBasePath(value: string): string {
  const fail = (): never => {
    throw new TypeError(
      'ODX proxy basePath must be an exact non-root local path without queries, fragments, traversal, or empty segments.',
    )
  }
  if (typeof value !== 'string'
    || value.length === 0
    || !value.startsWith('/')
    || value.startsWith('//')
    || value.includes('\\')
    || value.includes('?')
    || value.includes('#')
    || hasControlOrWhitespace(value)) {
    return fail()
  }
  const normalized = value.replace(RE_TRAILING_SLASHES, '')
  if (normalized.length === 0)
    return fail()
  for (const segment of normalized.slice(1).split('/')) {
    let decoded: string
    try {
      decoded = decodeURIComponent(segment)
    }
    catch {
      return fail()
    }
    if (segment.length === 0
      || decoded === '.'
      || decoded === '..'
      || decoded.includes('/')
      || decoded.includes('\\')
      || hasControlOrWhitespace(decoded)) {
      return fail()
    }
  }
  return normalized
}

/**
 * Parsed information about a proxied OData request.
 */
export interface ODataRequestInfo {
  serviceName: string
  odataPath: string
  query: string
  segments: string[]
}

/**
 * Extracts OData-specific path and query information from an H3 event.
 *
 * @param event - The incoming H3 event.
 * @param basePath - The ODX base path (default: /api/odx).
 * @returns Parsed OData request info.
 */
export function parseODataRequest(event: H3Event, basePath = '/api/odx'): ODataRequestInfo {
  const queryIndex = event.path.indexOf('?')
  const pathOnly = queryIndex === -1 ? event.path : event.path.slice(0, queryIndex)
  const normalizedBasePath = normalizeODataProxyBasePath(basePath)
  if (pathOnly !== normalizedBasePath && !pathOnly.startsWith(`${normalizedBasePath}/`)) {
    throw new TypeError('The request path is outside the configured ODX proxy basePath.')
  }
  const relativePath = pathOnly
    .slice(normalizedBasePath.length)
    .replace(RE_LEADING_SLASHES, '')
    .replace(RE_TRAILING_SLASHES, '')
  assertSafeODataResourcePath(relativePath)
  const segments = relativePath.length === 0 ? [] : relativePath.split('/')

  return {
    serviceName: segments[0] || 'unknown',
    odataPath: segments.slice(1).join('/'),
    query: queryIndex === -1 ? '' : event.path.slice(queryIndex),
    segments,
  }
}

function formatODataStringKey(value: string): string {
  return encodeURIComponent(value).replace(RE_SINGLE_QUOTE, '\'\'')
}

/**
 * Resolves the absolute target URL for a proxied request.
 *
 * @param event - The incoming H3 event (used for absolute URL resolution if target is relative).
 * @param targetBaseUrl - The base URL of the target service.
 * @param requestInfo - Parsed OData request information.
 * @param isRelative - Whether the target base URL is relative to the current server.
 * @param overrideServiceName - Optional technical service name to use in the path (instead of the route name).
 * @returns The final absolute target URL.
 */
export function resolveTargetUrl(
  event: H3Event,
  targetBaseUrl: string,
  requestInfo: ODataRequestInfo,
  isRelative = false,
  overrideServiceName?: string,
): string {
  const configuredFragmentIndex = targetBaseUrl.indexOf('#')
  const targetBaseWithoutFragment = configuredFragmentIndex < 0
    ? targetBaseUrl
    : targetBaseUrl.slice(0, configuredFragmentIndex)
  const configuredQueryIndex = targetBaseWithoutFragment.indexOf('?')
  const configuredQuery = configuredQueryIndex < 0
    ? ''
    : targetBaseWithoutFragment.slice(configuredQueryIndex + 1)
  let targetUrl = (configuredQueryIndex < 0
    ? targetBaseWithoutFragment
    : targetBaseWithoutFragment.slice(0, configuredQueryIndex)).replace(RE_TRAILING_SLASH, '')

  if (isRelative) {
    const serviceName = normalizeODataServiceRoute(overrideServiceName || requestInfo.serviceName)
    targetUrl += `/${serviceName}`
  }

  let query = requestInfo.query
  let odataPath = requestInfo.odataPath
  assertSafeODataResourcePath(odataPath)

  // Special handling for explorer-style id parameter: ?id=XYZ
  // We rewrite this into the OData path format: EntitySet('XYZ')
  if (query.includes('id=')) {
    const params = new URLSearchParams(query.startsWith('?') ? query.slice(1) : query)
    const id = params.get('id')
    if (id) {
      // 1. Remove id from query string
      params.delete('id')
      const remaining = params.toString()
      query = remaining ? `?${remaining}` : ''

      // 2. Format ID correctly (quotes for strings, none for numbers)
      // Note: We use encodeURIComponent to handle special characters in the ID
      const formattedId = (Number.isNaN(Number(id)) || id.trim() === '') ? `'${formatODataStringKey(id)}'` : id

      // 3. Append to path (ensure we don't double up parentheses if already present)
      if (!odataPath.endsWith(')')) {
        odataPath += `(${formattedId})`
      }
    }
  }

  const requestQuery = query.startsWith('?') ? query.slice(1) : query
  const combinedQuery = [configuredQuery, requestQuery]
    .filter(value => value.length > 0)
    .join('&')
  targetUrl += `/${odataPath}${combinedQuery.length > 0 ? `?${combinedQuery}` : ''}`
  // Ensure no double slashes (except after protocol)
  targetUrl = targetUrl.replace(RE_DOUBLE_SLASHES, '$1')

  if (targetUrl.startsWith('/')) {
    const url = getRequestURL(event)
    targetUrl = `${url.protocol}//${url.host}${targetUrl}`
  }

  return targetUrl
}
