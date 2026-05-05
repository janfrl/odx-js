import type { H3Event } from 'h3'
import { getRequestURL } from 'h3'

const RE_TRAILING_SLASH = /\/$/
const RE_TRAILING_SLASHES = /\/+$/
const RE_LEADING_SLASHES = /^\/+/
const RE_DOUBLE_SLASHES = /([^:]\/)\/+/g
const RE_SINGLE_QUOTE = /'/g

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
  const normalizedBasePath = basePath.replace(RE_TRAILING_SLASHES, '')
  const relativePath = pathOnly.slice(normalizedBasePath.length).replace(RE_LEADING_SLASHES, '')
  const segments = relativePath.split('/').filter(Boolean)

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
  let targetUrl = targetBaseUrl.replace(RE_TRAILING_SLASH, '')

  if (isRelative) {
    targetUrl += `/${overrideServiceName || requestInfo.serviceName}`
  }

  let query = requestInfo.query
  let odataPath = requestInfo.odataPath

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

  targetUrl += `/${odataPath}${query}`
  // Ensure no double slashes (except after protocol)
  targetUrl = targetUrl.replace(RE_DOUBLE_SLASHES, '$1')

  if (targetUrl.startsWith('/')) {
    const url = getRequestURL(event)
    targetUrl = `${url.protocol}//${url.host}${targetUrl}`
  }

  return targetUrl
}
