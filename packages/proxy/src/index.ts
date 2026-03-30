import type { ODataProxyConfig } from '@bc8-odx/core'
import { Buffer } from 'node:buffer'
import process from 'node:process'
import { defineEventHandler } from 'h3'
import odataHandler from './api/odata'
import { resolveBtpDestination } from './utils/btp-destination'

export { odataGuard } from './utils/rules'
export { addODataLog, clearODataLogs, createODataClient, fetchWithCsrf, getODataLogs } from '@bc8-odx/core'

const RE_QUERY_SPLIT = /\?/
const RE_LEADING_SLASH = /^\//

/**
 * Creates a standalone h3 event handler for OData proxying.
 * This function manually performs target resolution which is normally handled by the btp-auth plugin.
 * Used primarily for integration testing and standalone Nitro instances.
 *
 * @param config The proxy configuration.
 */
export function createODataHandler(config: ODataProxyConfig): ReturnType<typeof defineEventHandler> {
  return defineEventHandler(async (event) => {
    // Inject config into context as expected by the handler
    event.context.odataConfig = config

    // STANDALONE TARGET RESOLUTION (Simulates btp-auth.ts plugin)
    const basePath = config.basePath || '/api/odx'
    if (!event.path.startsWith(basePath)) {
      return odataHandler(event)
    }

    const pathOnly = event.path.split(RE_QUERY_SPLIT)[0] || ''
    const relativePath = pathOnly.slice(basePath.length).replace(RE_LEADING_SLASH, '')
    const segments = relativePath.split('/').filter(Boolean)
    const serviceRoute = segments[0]

    if (!serviceRoute) {
      return odataHandler(event)
    }

    const matched = config.services?.find((s: any) =>
      s.name.toLowerCase() === serviceRoute.toLowerCase()
      || (s.route && s.route.toLowerCase() === serviceRoute.toLowerCase()),
    )

    if (matched) {
      // Respect strategy: direct - don't set proxyTarget, odataHandler will handle it or pass through
      // Actually, odataHandler expects proxyTarget.
      const isRealCloud = !!process.env.VCAP_SERVICES
      const hasDestination = !!matched.destination
      const hasAbsoluteUrl = matched.url?.startsWith('http')
      const isDirect = matched.strategy === 'direct'

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
        event.context.proxyTarget = {
          url: matched.url,
          authHeader: authHeaderValue,
          isRelative: false,
          strategy: matched.strategy,
        }
      }
      else if (!isDirect && (hasDestination || isRealCloud)) {
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
          event.context.proxyTarget = {
            url: destination.url,
            authHeader: authHeaderValue,
            isRelative: false,
            strategy: matched.strategy,
          }
        }
        catch {
          // Fallback for tests if BTP resolution fails
          event.context.proxyTarget = { url: '/sap/opu/odata/sap', authHeader: '', isRelative: true, strategy: matched.strategy }
        }
      }
      else {
        const auth = matched.auth || {}
        let authHeaderValue = ''
        if (auth.bearerToken) {
          authHeaderValue = `Bearer ${auth.bearerToken}`
        }
        else if (auth.username && auth.password) {
          authHeaderValue = `Basic ${Buffer.from(`${auth.username}:${auth.password}`).toString('base64')}`
        }

        event.context.proxyTarget = {
          url: matched.url || '/sap/opu/odata/sap',
          authHeader: authHeaderValue,
          isRelative: !matched.url?.startsWith('http'),
          strategy: matched.strategy,
        }
      }
    }

    return odataHandler(event)
  })
}
