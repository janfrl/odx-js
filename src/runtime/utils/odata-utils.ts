/**
 * Recursive flattener for OData V2 'results' structures and removes metadata.
 * Preserves count information if present.
 */
export function flattenOData(data: any): any {
  if (!data || typeof data !== 'object')
    return data

  const count = data.__count || data['@odata.count'] || data.count

  if (data.results && Array.isArray(data.results)) {
    const flattened = data.results.map((item: any) => flattenOData(item))
    if (count !== undefined) {
      (flattened as any).totalCount = Number(count)
    }
    return flattened
  }

  if (Array.isArray(data))
    return data.map(item => flattenOData(item))

  const flattened: any = {}
  for (const key in data) {
    if (key === '__metadata' || key === '__deferred')
      continue
    flattened[key] = flattenOData(data[key])
  }
  return Object.keys(flattened).length > 0 ? flattened : null
}

/**
 * Sanitizes a base URL by removing redundant slashes and ensuring no trailing slash.
 */
export function sanitizeBaseURL(url: string): string {
  if (!url) return ''
  return url.replace(/([^:]\/)\/+/g, '$1').replace(/\/$/, '')
}

/**
 * Merges multiple header initializers into a plain record.
 */
export function mergeHeaders(...headers: (HeadersInit | undefined)[]): Record<string, string> {
  const merged: Record<string, string> = {}
  for (const h of headers) {
    if (!h) continue
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
    if (value === undefined || value === null) continue
    result[key] = String(value)
  }
  return result
}
