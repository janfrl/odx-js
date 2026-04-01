import type { H3Event } from 'h3'
import { getRequestURL } from 'h3'

const RE_QUERY_SPLIT = /\?/
const RE_TRAILING_SLASH = /\/$/
const RE_LEADING_SLASH = /^\//
const RE_DOUBLE_SLASHES = /([^:]\/)\/+/g

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
  const pathOnly = event.path.split(RE_QUERY_SPLIT)[0] || ''
  const relativePath = pathOnly.slice(basePath.length).replace(RE_LEADING_SLASH, '')
  const segments = relativePath.split('/').filter(Boolean)

  return {
    serviceName: segments[0] || 'unknown',
    odataPath: segments.slice(1).join('/'),
    query: event.path.includes('?') ? `?${event.path.split(RE_QUERY_SPLIT)[1]}` : '',
    segments,
  }
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

  targetUrl += `/${requestInfo.odataPath}${requestInfo.query}`
  // Ensure no double slashes (except after protocol)
  targetUrl = targetUrl.replace(RE_DOUBLE_SLASHES, '$1')

  if (targetUrl.startsWith('/')) {
    const url = getRequestURL(event)
    targetUrl = `${url.protocol}//${url.host}${targetUrl}`
  }

  return targetUrl
}
