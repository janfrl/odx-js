import type { FetchOptions } from 'ofetch'
import { flattenOData } from './odata-utils'

export { flattenOData, mergeHeaders, sanitizeBaseURL, stringifyQuery } from './odata-utils.ts'

/**
 * Low-level OData utility.
 * Executes a single OData request using the provided client.
 */
export async function $odata<T = unknown>(
  client: { <R>(path: string, options?: any): Promise<R> },
  service: string,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET',
  options: FetchOptions<'json'> & { entitySet?: string } = {},
): Promise<T> {
  const path = options.entitySet ? `${service}/${options.entitySet}` : service
  const res = await client<T>(path, {
    method,
    query: options.query,
    body: options.body,
    headers: options.headers,
  })
  return flattenOData(res) as T
}
