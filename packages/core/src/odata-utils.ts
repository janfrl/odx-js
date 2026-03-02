import { Buffer } from 'node:buffer'

/**
 * Recursive flattener for OData V2 'results' structures and removes metadata.
 * Preserves count information if present.
 *
 * @param data The data to flatten
 * @param depth Current recursion depth
 * @param maxDepth Maximum recursion depth (default 10)
 */
export function flattenOData(data: any, depth = 0, maxDepth = 10): any {
  if (depth > maxDepth)
    return '[Max Depth Reached]'

  if (!data)
    return data

  // Handle Binary Data (Buffers, Uint8Arrays)
  if (data instanceof Uint8Array || (typeof Buffer !== 'undefined' && Buffer.isBuffer(data))) {
    return `[Binary Data, ${data.length} bytes]`
  }

  if (typeof data !== 'object') {
    return data
  }

  const count = data.__count || data['@odata.count'] || data.count

  if (data.results && Array.isArray(data.results)) {
    const flattened = data.results.map((item: any) => flattenOData(item, depth + 1, maxDepth))
    if (count !== undefined) {
      (flattened as any).totalCount = Number(count)
    }
    return flattened
  }

  if (Array.isArray(data))
    return data.map(item => flattenOData(item, depth + 1, maxDepth))

  const flattened: any = {}
  let hasProperties = false
  for (const key in data) {
    if (key === '__metadata' || key === '__deferred')
      continue
    flattened[key] = flattenOData(data[key], depth + 1, maxDepth)
    hasProperties = true
  }
  return hasProperties ? flattened : null
}

/**
 * Sanitizes a base URL by removing redundant slashes and ensuring no trailing slash.
 */
export function sanitizeBaseURL(url: string): string {
  if (!url)
    return ''
  return url.replace(/([^:]\/)\/+/g, '$1').replace(/\/$/, '')
}

/**
 * Merges multiple header initializers into a plain record.
 */
export function mergeHeaders(...headers: (HeadersInit | undefined)[]): Record<string, string> {
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
 */
export function stringifyQuery(query: Record<string, any>): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null)
      continue
    result[key] = String(value)
  }
  return result
}
