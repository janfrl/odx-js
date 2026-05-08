import type { ODataProxyConfig } from '@bc8-odx/core'
import type { H3Event } from 'h3'
import { Buffer } from 'node:buffer'
import process from 'node:process'
import { resolveBtpDestination } from './btp-destination'

/**
 * Resolves the proxy target configuration for a given event and module config.
 * Encapsulates the logic for absolute URLs, BTP destinations, and local relative paths.
 */
export async function resolveProxyTarget(
  event: H3Event,
  config: ODataProxyConfig,
  serviceRoute: string,
  options: { allowBtpDestinationFallback?: boolean } = {},
): Promise<any> {
  const matched = config.services?.find((s: any) =>
    s.name.toLowerCase() === serviceRoute.toLowerCase()
    || (s.route && s.route.toLowerCase() === serviceRoute.toLowerCase()),
  )

  if (!matched)
    return null

  const isRealCloud = !!process.env.VCAP_SERVICES
  const hasDestination = !!matched.destination
  const hasAbsoluteUrl = matched.url?.startsWith('http')
  const isDirect = matched.strategy === 'direct'
  const proxyMode = matched.proxyMode || config.defaultProxyMode

  // 1. Absolute URL
  if (hasAbsoluteUrl) {
    const auth = matched.auth || {}
    let authHeaderValue = ''
    if (!isDirect) {
      if (auth.bearerToken) {
        authHeaderValue = `Bearer ${auth.bearerToken}`
      }
      else if (auth.username && auth.password) {
        authHeaderValue = `Basic ${Buffer.from(`${auth.username}:${auth.password}`).toString('base64')}`
      }
    }
    return {
      url: matched.url,
      authHeader: authHeaderValue,
      isRelative: false,
      strategy: matched.strategy,
      proxyMode,
    }
  }

  // 2. BTP Destination Resolution
  if (!isDirect && (hasDestination || isRealCloud)) {
    try {
      const btpTargetName = matched.destination || matched.name
      const authHeader = event.headers.get('authorization')
      const destination = await resolveBtpDestination(btpTargetName, authHeader || undefined)
      let authHeaderValue = ''
      if (destination.authTokens?.[0]) {
        authHeaderValue = `Bearer ${destination.authTokens[0].value}`
      }
      else if (destination.user && destination.password) {
        authHeaderValue = `Basic ${Buffer.from(`${destination.user}:${destination.password}`).toString('base64')}`
      }
      return {
        url: destination.url,
        authHeader: authHeaderValue,
        isRelative: false,
        strategy: matched.strategy,
        proxyMode,
      }
    }
    catch (err) {
      if (options.allowBtpDestinationFallback === false) {
        throw err
      }

      // Fallback for tests if BTP resolution fails
      return {
        url: '/sap/opu/odata/sap',
        authHeader: '',
        isRelative: true,
        strategy: matched.strategy,
        proxyMode,
      }
    }
  }

  // 3. Local / Relative URL (Default)
  const auth = matched.auth || {}
  let authHeaderValue = ''
  if (auth.bearerToken) {
    authHeaderValue = `Bearer ${auth.bearerToken}`
  }
  else if (auth.username && auth.password) {
    authHeaderValue = `Basic ${Buffer.from(`${auth.username}:${auth.password}`).toString('base64')}`
  }

  // If the URL is relative (e.g. points to an local EDMX file), we route it to the local SAP OData prefix.
  // This is where the mock server or local SAP backend is usually reachable.
  const isRelative = !matched.url?.startsWith('http')
  const baseUrl = isRelative ? '/sap/opu/odata/sap' : (matched.url || '/sap/opu/odata/sap')

  return {
    url: baseUrl,
    authHeader: authHeaderValue,
    isRelative,
    strategy: matched.strategy,
    proxyMode,
  }
}
