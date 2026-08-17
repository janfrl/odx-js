import type { FetchOptions, MappedResponseType, ResponseType } from 'ofetch'
import { ofetch } from 'ofetch'
import { mergeHeaders } from './odata-utils'

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])
const RE_SET_COOKIE_SEPARATOR = /,(?=\s*[^;,=\s]+\s*=)/g

export type SapCsrfFetchMethod = 'GET' | 'HEAD'

/** Server/edge options for a request-scoped SAP CSRF token preflight. */
export interface SapCsrfPreparationOptions {
  method?: string
  headers?: HeadersInit | Record<string, unknown>
  fetchMethod?: SapCsrfFetchMethod
  agent?: unknown
  dispatcher?: FetchOptions<'json'>['dispatcher']
  signal?: AbortSignal | null
  timeout?: number
  retry?: FetchOptions['retry']
  retryDelay?: number
  retryStatusCodes?: number[]
}

/** Raised when an explicitly protected SAP mutation cannot obtain a token. */
export class SapCsrfTokenError extends Error {
  constructor() {
    super('SAP CSRF preflight did not return an x-csrf-token header.')
    this.name = 'SapCsrfTokenError'
  }
}

function readSetCookieHeaders(headers: Headers): string[] {
  const getSetCookie = (headers as unknown as { getSetCookie?: () => string[] }).getSetCookie
  if (typeof getSetCookie === 'function')
    return getSetCookie.call(headers)

  const combined = headers.get('set-cookie')
  return combined ? combined.split(RE_SET_COOKIE_SEPARATOR).map(value => value.trim()) : []
}

function mergeCookieHeader(existingCookie: string | undefined, setCookieHeaders: readonly string[]): string | undefined {
  const cookies = new Map<string, string>()

  const addCookie = (cookie: string): void => {
    const pair = cookie.split(';', 1)[0]?.trim()
    const separator = pair?.indexOf('=') ?? -1
    if (!pair || separator <= 0)
      return
    cookies.set(pair.slice(0, separator).trim(), pair)
  }

  for (const cookie of existingCookie?.split(';') ?? [])
    addCookie(cookie)
  for (const cookie of setCookieHeaders)
    addCookie(cookie)

  return cookies.size > 0 ? [...cookies.values()].join('; ') : undefined
}

/**
 * Prepares request headers for SAP OData V2 and V4 mutations. Safe methods
 * pass through without a preflight request.
 */
export async function prepareSapCsrfHeaders(
  targetUrl: string,
  options: SapCsrfPreparationOptions = {},
): Promise<Record<string, string>> {
  const headers = mergeHeaders(options.headers)
  const method = (options.method || 'GET').toUpperCase()
  if (SAFE_METHODS.has(method))
    return headers

  const preflightResponse = await ofetch.raw(targetUrl, {
    method: options.fetchMethod ?? 'HEAD',
    headers: mergeHeaders(headers, { 'x-csrf-token': 'Fetch' }),
    agent: options.agent,
    dispatcher: options.dispatcher,
    signal: options.signal,
    timeout: options.timeout,
    retry: options.retry,
    retryDelay: options.retryDelay,
    retryStatusCodes: options.retryStatusCodes,
  })

  const csrfToken = preflightResponse.headers.get('x-csrf-token')
  if (!csrfToken)
    throw new SapCsrfTokenError()

  const cookie = mergeCookieHeader(headers.cookie, readSetCookieHeaders(preflightResponse.headers))
  return mergeHeaders(headers, {
    'x-csrf-token': csrfToken,
    ...(cookie ? { cookie } : {}),
  })
}

/**
 * Performs a server/edge request with a request-scoped SAP CSRF token and its
 * matching backend session cookies. Browsers must use the ODX proxy because
 * they cannot read Set-Cookie or emit a Cookie request header.
 */
export async function fetchWithCsrf<T = unknown, R extends ResponseType = 'json'>(
  targetUrl: string,
  options: FetchOptions<R> = {},
  csrfOptions: Pick<SapCsrfPreparationOptions, 'fetchMethod'> = {},
): Promise<MappedResponseType<R, T>> {
  const headers = await prepareSapCsrfHeaders(targetUrl, {
    method: options.method,
    headers: options.headers,
    fetchMethod: csrfOptions.fetchMethod,
    agent: options.agent,
    dispatcher: options.dispatcher,
    signal: options.signal,
    timeout: options.timeout,
    retry: options.retry,
    retryDelay: typeof options.retryDelay === 'number' ? options.retryDelay : undefined,
    retryStatusCodes: options.retryStatusCodes,
  })

  return ofetch<T, R>(targetUrl, {
    ...options,
    headers,
  })
}
