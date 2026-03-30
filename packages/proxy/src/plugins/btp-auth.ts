import { Buffer } from 'node:buffer'
import process from 'node:process'
import { defineNitroPlugin, useRuntimeConfig } from 'nitropack/runtime'
import { resolveBtpDestination } from '../utils/btp-destination'

const RE_QUERY_SPLIT = /\?/
const RE_LEADING_SLASH = /^\//

/**
 * Nitro plugin to resolve proxy targets for OData services.
 * Handles BTP destinations, absolute URLs, and local mock services.
 * Stores result in event.context.proxyTarget for subsequent proxying.
 */
export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook('request', async (event): Promise<void> => {
    const runtimeConfig = useRuntimeConfig(event)
    const config = runtimeConfig.odata as any

    if (!config) {
      return
    }

    // Initialize telemetry trace array
    const startTime = Date.now()
    const trace: any[] = []
    event.context.proxyTrace = trace

    const addTrace = (label: string, message: string, details?: any, status: 'success' | 'error' | 'info' = 'info'): void => {
      trace.push({
        timestamp: Date.now(),
        duration: Date.now() - startTime,
        label,
        message,
        details,
        status,
      })
    }

    // Inject config into event context for other handlers/plugins
    event.context.odataConfig = config

    const basePath = config.basePath || '/api/odx'
    if (!event.path.startsWith(basePath)) {
      return
    }

    const pathOnly = event.path.split(RE_QUERY_SPLIT)[0] || ''
    const relativePath = pathOnly.slice(basePath.length).replace(RE_LEADING_SLASH, '')
    const segments = relativePath.split('/').filter(Boolean)
    const serviceRoute = segments[0]

    if (!serviceRoute) {
      return
    }

    const matched = config.services?.find((s: any) =>
      s.name.toLowerCase() === serviceRoute.toLowerCase()
      || (s.route && s.route.toLowerCase() === serviceRoute.toLowerCase()),
    )

    if (!matched) {
      addTrace('Proxy', `Unknown service route: ${serviceRoute}`, { path: event.path }, 'error')
      return
    }

    const isRealCloud = !!process.env.VCAP_SERVICES
    const hasDestination = !!matched.destination
    const hasAbsoluteUrl = matched.url?.startsWith('http')
    const isDirect = matched.strategy === 'direct'

    // 1. Resolve Absolute URL (Prioritized)
    if (hasAbsoluteUrl) {
      addTrace('Proxy', `Using absolute URL for ${matched.name}`, { url: matched.url })
      const auth = matched.auth || {}
      let authHeaderValue = ''

      // Only apply auth if not using 'direct' strategy (CORS Bridge Mode)
      if (!isDirect) {
        if (auth.bearerToken) {
          addTrace('Auth', 'Using Bearer Token')
          authHeaderValue = `Bearer ${auth.bearerToken}`
        }
        else if (auth.username && auth.password) {
          addTrace('Auth', 'Using Basic Auth')
          authHeaderValue = `Basic ${Buffer.from(`${auth.username}:${auth.password}`).toString('base64')}`
        }
      }
      else {
        addTrace('Proxy', 'Strategy is "direct", skipping auth')
      }

      event.context.proxyTarget = {
        url: matched.url,
        authHeader: authHeaderValue,
        isRelative: false,
        strategy: matched.strategy,
      }
      return
    }

    // 2. Resolve BTP Destination (if explicitly configured or in cloud)
    if (!isDirect && (hasDestination || isRealCloud)) {
      const btpTargetName = matched.destination || matched.name
      addTrace('BTP', `Resolving BTP Destination: ${btpTargetName}`)
      try {
        const authHeader = event.headers.get('authorization')
        const destination = await resolveBtpDestination(btpTargetName, authHeader || undefined)

        let authHeaderValue = ''
        if (destination.authTokens?.[0]) {
          addTrace('BTP', 'Principal Propagation: Using SAML Bearer token')
          authHeaderValue = `Bearer ${destination.authTokens[0].value}`
        }
        else if (destination.user && destination.password) {
          addTrace('BTP', 'Technical User: Using Basic Auth')
          authHeaderValue = `Basic ${Buffer.from(`${destination.user}:${destination.password}`).toString('base64')}`
        }

        addTrace('BTP', `Destination resolved to: ${destination.url}`, { proxyType: destination.proxyType || 'Internet' }, 'success')

        event.context.proxyTarget = {
          url: destination.url,
          authHeader: authHeaderValue,
          isRelative: false,
          strategy: matched.strategy,
        }
        return
      }
      catch (err: any) {
        addTrace('BTP', `Failed to resolve destination: ${err.message}`, { error: err }, 'error')
        if (process.env.NODE_ENV === 'production') {
          console.error(`[@bc8-odx/proxy] BTP Destination Error [${matched.name}]:`, err.message)
        }
      }
    }

    // 3. Fallback to Local Mock Service (Relative Standard SAP Path)
    addTrace('Proxy', `Routing to local mock for ${matched.name}`, { path: `/sap/opu/odata/sap` })

    const auth = matched.auth || {}
    let authHeaderValue = ''
    if (auth.bearerToken) {
      authHeaderValue = `Bearer ${auth.bearerToken}`
    }
    else if (auth.username && auth.password) {
      authHeaderValue = `Basic ${Buffer.from(`${auth.username}:${auth.password}`).toString('base64')}`
    }

    event.context.proxyTarget = {
      url: '/sap/opu/odata/sap',
      authHeader: authHeaderValue,
      isRelative: true,
      strategy: matched.strategy,
    }
  })
})
