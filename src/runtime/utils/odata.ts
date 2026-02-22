import type { FetchOptions } from 'ofetch'
import { createODataClient } from './odata-client'

/**
 * Low-level OData util.
 * Executes a single OData request.
 * Always returns a Promise.
 */
export async function $odata<T = unknown>(
  service: string,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET',
  options: FetchOptions<'json'> & { entitySet?: string } = {},
): Promise<T> {
  const client = createODataClient()
  const path = options.entitySet ? `${service}/${options.entitySet}` : service
  return client<T>(path, {
    method,
    query: options.query,
    body: options.body,
    headers: options.headers,
  })
}
