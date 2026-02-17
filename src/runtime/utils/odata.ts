import { createODataClient } from './odata-client'
import type { FetchOptions } from 'ofetch'

/**
 * Low-level OData util.
 * Executes a single OData request.
 * Always returns a Promise.
 */
export async function $odata<T = unknown>(
  service: string,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET',
  options: FetchOptions<'json'> = {},
): Promise<T> {
  const client = createODataClient()
  return client<T>(service, {
    method,
    query: options.query,
    body: options.body,
    headers: options.headers,
  })
}
