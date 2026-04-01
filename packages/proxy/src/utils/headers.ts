import { mergeHeaders } from '@bc8-odx/core'

/**
 * Restricted headers that should not be forwarded to the target OData service.
 */
export const RESTRICTED_HEADERS = new Set([
  'host',
  'connection',
  'content-length',
  'content-encoding',
  'transfer-encoding',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailers',
  'upgrade',
])

/**
 * Prepares the final set of headers for a proxied OData request.
 * Merges service-level defaults with incoming request headers and applies security/cleaning rules.
 *
 * @param incomingHeaders - Headers from the original H3 event.
 * @param serviceHeaders - Default headers configured for the specific OData service.
 * @param authHeader - Optional authorization header (e.g., resolved from BTP or config).
 * @returns A record of lowercase, cleaned headers.
 */
export function prepareProxyHeaders(
  incomingHeaders: Record<string, string | undefined>,
  serviceHeaders: Record<string, string> = {},
  authHeader?: string,
): Record<string, string> {
  // Merge: Service Defaults < Incoming Overrides
  const merged = mergeHeaders(serviceHeaders, incomingHeaders)

  // Filter restricted headers and ensure lowercase keys
  const final: Record<string, string> = {}
  for (const [key, value] of Object.entries(merged)) {
    const lowerKey = key.toLowerCase()
    if (!RESTRICTED_HEADERS.has(lowerKey)) {
      final[lowerKey] = value
    }
  }

  // Inject Authorization if provided
  if (authHeader) {
    final.authorization = authHeader
  }

  return final
}
