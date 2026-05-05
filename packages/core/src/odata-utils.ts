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
  if (data.d) {
    return flattenOData(data.d, depth + 1, maxDepth)
  }

  // 2. Handle OData Results (V2 results or V4 value)
  const results = Array.isArray(data.results)
    ? data.results
    : Array.isArray(data.value)
      ? data.value
      : undefined
  if (results) {
    const count = data.__count || data['@odata.count'] || data.count
    const flattened = results.map((item: any) => flattenOData(item, depth + 1, maxDepth))
    if (count !== undefined) {
      (flattened as any).totalCount = Number(count)
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

    flattened[key] = flattenOData(data[key], depth + 1, maxDepth)
    hasProperties = true
  }

  // If we have no properties left after stripping (but we HAD an object), return null
  // This helps represents stripped metadata objects as null.
  return hasProperties ? flattened : null
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
