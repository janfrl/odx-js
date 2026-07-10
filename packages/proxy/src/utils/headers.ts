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

const RESTRICTED_INCOMING_HEADERS = new Set([
  ...RESTRICTED_HEADERS,
  'cookie',
  'via',
  'x-real-ip',
  'forwarded',
  'set-cookie',
])

export interface PrepareProxyHeaderOptions {
  forwardAuthorization?: boolean
}

/**
 * Prepares the final set of headers for a proxied OData request.
 * Merges service-level defaults with incoming request headers and applies security/cleaning rules.
 *
 * @param incomingHeaders - Headers from the original H3 event.
 * @param serviceHeaders - Default headers configured for the specific OData service.
 * @param authHeader - Optional authorization header (e.g., resolved from BTP or config).
 * @param options - Controls explicit forwarding behavior for sensitive incoming headers.
 * @returns A record of lowercase, cleaned headers.
 */
export function prepareProxyHeaders(
  incomingHeaders: Record<string, string | undefined>,
  serviceHeaders: Record<string, string> = {},
  authHeader?: string,
  options: PrepareProxyHeaderOptions = {},
): Record<string, string> {
  // Ambient browser and reverse-proxy credentials must not leak to the OData
  const connectionTokens = new Set(
    (incomingHeaders.connection || '')
      .split(',')
      .map(token => token.trim().toLowerCase())
      .filter(Boolean),
  )
  // backend. Operators can still configure an explicit backend Cookie header
  // through serviceHeaders when a legacy service requires one.
  const safeIncomingHeaders: Record<string, string> = {}
  for (const [key, value] of Object.entries(incomingHeaders)) {
    const lowerKey = key.toLowerCase()
    const isForwardingMetadata = lowerKey === 'forwarded'
      || lowerKey.startsWith('x-forwarded-')
    const isBlockedAuthorization = lowerKey === 'authorization'
      && options.forwardAuthorization === false

    if (
      value !== undefined
      && !isBlockedAuthorization
      && !isForwardingMetadata
      && !RESTRICTED_INCOMING_HEADERS.has(lowerKey)
      && !connectionTokens.has(lowerKey)
    ) {
      safeIncomingHeaders[lowerKey] = value
    }
  }

  // Merge: Service Defaults < Safe Incoming Overrides
  const merged = mergeHeaders(serviceHeaders, safeIncomingHeaders)

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
