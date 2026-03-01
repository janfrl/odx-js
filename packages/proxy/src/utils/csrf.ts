import { ofetch } from 'ofetch'

/**
 * Executes a fetch request with automatic SAP CSRF token handling.
 * Works for both OData V2 and V4.
 * For mutations (POST, PUT, PATCH, DELETE), it first performs a HEAD request
 * to fetch a valid CSRF token and session cookies.
 */
export async function fetchWithCsrf<T = any>(targetUrl: string, options: any): Promise<T> {
  const method = (options.method || 'GET').toUpperCase()

  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return ofetch<T>(targetUrl, options)
  }

  const preflightOptions = {
    method: 'HEAD',
    headers: {
      ...options.headers,
      'x-csrf-token': 'Fetch',
    },
  }

  const preflightResponse = await ofetch.raw(targetUrl, preflightOptions)
  const csrfToken = preflightResponse.headers.get('x-csrf-token')
  const setCookie = preflightResponse.headers.get('set-cookie')

  const finalHeaders = {
    ...options.headers,
  }

  if (csrfToken) {
    finalHeaders['x-csrf-token'] = csrfToken
  }

  if (setCookie) {
    const cookies = setCookie.split(/[ ,]+/).filter(c => c.includes('=')).join('; ')
    finalHeaders.cookie = finalHeaders.cookie ? `${finalHeaders.cookie}; ${cookies}` : cookies
  }

  return ofetch<T>(targetUrl, {
    ...options,
    headers: finalHeaders,
  })
}
