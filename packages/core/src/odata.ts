import type { FetchOptions } from 'ofetch'
import type { ODataCollectionPage, ODataEntityResponse, ODataMutationResponse } from './types'
import { flattenOData, mergeHeaders, toODataCollectionPage } from './odata-utils'

export { flattenOData, mergeHeaders, sanitizeBaseURL, stringifyQuery } from './odata-utils'

/**
 * Low-level OData utility.
 * Executes a single OData request using the provided client.
 */
export async function $odata<T = unknown>(
  client: { <R>(path: string, options?: any): Promise<R> },
  service: string,
  method: 'GET' | 'POST' | 'PATCH' | 'MERGE' | 'DELETE' = 'GET',
  options: FetchOptions<'json'> & { entitySet?: string } = {},
): Promise<T> {
  const { entitySet, headers, ...requestOptions } = options
  const path = entitySet ? `${service}/${entitySet}` : service
  const res = await client<T>(path, {
    ...requestOptions,
    headers: mergeHeaders({ accept: 'application/json' }, headers as HeadersInit | undefined),
    method,
  })
  return flattenOData(res) as T
}

/**
 * Executes a collection read while preserving count and safe server-driven
 * paging metadata in an SSR-serializable page object.
 */
export async function $odataPage<T = unknown>(
  client: { <R>(path: string, options?: any): Promise<R> },
  service: string,
  options: FetchOptions<'json'> & { entitySet?: string } = {},
): Promise<ODataCollectionPage<T>> {
  const { entitySet, headers, ...requestOptions } = options
  const path = entitySet ? `${service}/${entitySet}` : service
  const response = await client<unknown>(path, {
    ...requestOptions,
    headers: mergeHeaders({ accept: 'application/json' }, headers as HeadersInit | undefined),
    method: 'GET',
  })
  return toODataCollectionPage<T>(response)
}

/**
 * Executes an entity read while retaining only the ETag transport metadata
 * needed for optimistic concurrency. The HTTP header is authoritative; body
 * annotations are compatibility fallbacks for OData V4 and V2 services.
 */
export async function $odataWithResponse<T = unknown>(
  client: {
    raw: <R>(path: string, options?: any) => Promise<{
      _data?: R
      headers: { get: (name: string) => string | null }
    }>
  },
  service: string,
  method: 'GET' = 'GET',
  options: FetchOptions<'json'> & { entitySet?: string } = {},
): Promise<ODataEntityResponse<T>> {
  const response = await requestWithResponse(client, service, method, options)
  return {
    data: flattenOData(response.body) as T,
    ...(response.etag ? { etag: response.etag } : {}),
  }
}

/**
 * Executes an entity mutation while preserving its next ETag. The entity
 * representation is optional because an update may validly return 204.
 */
export async function $odataMutationWithResponse<T = unknown>(
  client: {
    raw: <R>(path: string, options?: any) => Promise<{
      _data?: R
      headers: { get: (name: string) => string | null }
    }>
  },
  service: string,
  method: 'POST' | 'PATCH' | 'MERGE' | 'DELETE',
  options: FetchOptions<'json'> & { entitySet?: string } = {},
): Promise<ODataMutationResponse<T>> {
  const response = await requestWithResponse(client, service, method, options)
  return {
    ...(response.body === undefined ? {} : { data: flattenOData(response.body) as T }),
    ...(response.etag ? { etag: response.etag } : {}),
  }
}

async function requestWithResponse(
  client: {
    raw: <R>(path: string, options?: any) => Promise<{
      _data?: R
      headers: { get: (name: string) => string | null }
    }>
  },
  service: string,
  method: 'GET' | 'POST' | 'PATCH' | 'MERGE' | 'DELETE',
  options: FetchOptions<'json'> & { entitySet?: string },
): Promise<{ body: unknown, etag?: string }> {
  const { entitySet, headers, ...requestOptions } = options
  const path = entitySet ? `${service}/${entitySet}` : service
  const response = await client.raw<unknown>(path, {
    ...requestOptions,
    headers: mergeHeaders({ accept: 'application/json' }, headers as HeadersInit | undefined),
    method,
  })
  const body = response._data
  const headerEtag = normalizeEtag(response.headers.get('etag'))
  const etag = headerEtag ?? extractBodyEtag(body)

  return { body, ...(etag ? { etag } : {}) }
}

function normalizeEtag(value: unknown): string | undefined {
  if (typeof value !== 'string')
    return undefined
  const normalized = value.trim()
  return normalized.length > 0 ? normalized : undefined
}

function extractBodyEtag(body: unknown): string | undefined {
  if (!body || typeof body !== 'object' || Array.isArray(body))
    return undefined

  const record = body as Record<string, unknown>
  const v4Etag = normalizeEtag(record['@odata.etag'])
  if (v4Etag)
    return v4Etag

  const v2Entity = record.d
  if (!v2Entity || typeof v2Entity !== 'object' || Array.isArray(v2Entity))
    return undefined
  const metadata = (v2Entity as Record<string, unknown>).__metadata
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata))
    return undefined
  return normalizeEtag((metadata as Record<string, unknown>).etag)
}
