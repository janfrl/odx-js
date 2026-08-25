import type {
  ODataMediaCreateOptions,
  ODataMediaCreateResponse,
  ODataMediaMutationResponse,
  ODataMediaResponse,
  ODataRequestOptions,
} from './types'
import { flattenOData, mergeHeaders } from './odata-utils'

interface ODataRawClient {
  raw: <T>(path: string, options?: unknown) => Promise<{
    _data?: T
    headers: { get: (name: string) => string | null }
  }>
}

export interface ODataMediaTransportUpdateOptions extends ODataRequestOptions {
  readonly contentType: string
}

export async function $odataCreateMedia<T>(
  client: ODataRawClient,
  path: string,
  body: ArrayBuffer | Uint8Array,
  options: ODataMediaCreateOptions,
): Promise<ODataMediaCreateResponse<T>> {
  const { contentType, slug, ...requestOptions } = options
  const normalizedSlug = validateODataMediaSlug(slug)
  const response = await client.raw<T>(path, {
    ...requestOptions,
    body: validateODataMediaBody(body),
    headers: mergeHeaders(
      requestOptions.headers,
      {
        'content-type': validateODataMediaType(contentType),
        'prefer': 'return=representation',
        ...(normalizedSlug === undefined ? {} : { slug: normalizedSlug }),
      },
    ),
    method: 'POST',
    responseType: 'json',
  })
  const entityId = response.headers.get('odata-entityid')?.trim() || undefined
  const etag = response.headers.get('etag')?.trim() || undefined
  const location = response.headers.get('location')?.trim() || undefined
  const sapMessage = response.headers.get('sap-message')?.trim() || undefined
  return {
    ...(response._data === undefined ? {} : { data: flattenOData(response._data) as T }),
    ...(entityId === undefined ? {} : { entityId }),
    ...(etag === undefined ? {} : { etag }),
    ...(location === undefined ? {} : { location }),
    ...(sapMessage === undefined ? {} : { sapMessage }),
  }
}

const RE_HEADER_NEWLINE = /[\r\n]/u
const RE_MEDIA_TYPE = /^[^\s/;]+\/[^\s/;]+(?:\s*;[^\r\n]+)?$/u

export function validateODataMediaType(value: string): string {
  const normalized = value.trim()
  if (
    normalized.length === 0
    || RE_HEADER_NEWLINE.test(normalized)
    || !RE_MEDIA_TYPE.test(normalized)
  ) {
    throw new TypeError('An OData media update requires a valid content type.')
  }
  return normalized
}

export function validateODataMediaBody(
  body: ArrayBuffer | Uint8Array,
): ArrayBuffer | Uint8Array {
  if (!(body instanceof ArrayBuffer) && !(body instanceof Uint8Array))
    throw new TypeError('An OData media mutation requires an ArrayBuffer or Uint8Array body.')
  return body
}

export function validateODataMediaSlug(value: string | undefined): string | undefined {
  if (value === undefined)
    return undefined
  const normalized = value.trim()
  if (normalized.length === 0 || RE_HEADER_NEWLINE.test(normalized))
    throw new TypeError('An OData media create requires a valid slug.')
  return normalized
}

export async function $odataFetchMedia(
  client: ODataRawClient,
  path: string,
  options: ODataRequestOptions = {},
): Promise<ODataMediaResponse> {
  const response = await client.raw<ArrayBuffer>(path, {
    ...options,
    headers: mergeHeaders(
      { accept: 'application/octet-stream' },
      options.headers,
    ),
    method: 'GET',
    responseType: 'arrayBuffer',
  })
  if (!(response._data instanceof ArrayBuffer))
    throw new TypeError('ODX returned an invalid media response body.')
  const contentDisposition = response.headers.get('content-disposition') ?? undefined
  const contentType = response.headers.get('content-type') ?? undefined
  const etag = response.headers.get('etag') ?? undefined
  return {
    data: response._data,
    ...(contentDisposition === undefined ? {} : { contentDisposition }),
    ...(contentType === undefined ? {} : { contentType }),
    ...(etag === undefined ? {} : { etag }),
  }
}

export async function $odataUpdateMedia(
  client: ODataRawClient,
  path: string,
  body: ArrayBuffer | Uint8Array,
  options: ODataMediaTransportUpdateOptions,
): Promise<ODataMediaMutationResponse> {
  const { contentType, ...requestOptions } = options
  const response = await client.raw<unknown>(path, {
    ...requestOptions,
    body: validateODataMediaBody(body),
    headers: mergeHeaders(
      requestOptions.headers,
      { 'content-type': validateODataMediaType(contentType) },
    ),
    method: 'PUT',
    responseType: 'arrayBuffer',
  })
  const etag = response.headers.get('etag') ?? undefined
  const sapMessage = response.headers.get('sap-message')?.trim() || undefined
  return {
    ...(etag === undefined ? {} : { etag }),
    ...(sapMessage === undefined ? {} : { sapMessage }),
  }
}
