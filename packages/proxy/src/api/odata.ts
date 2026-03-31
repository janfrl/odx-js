import process from 'node:process'
import { addODataLog, flattenOData } from '@bc8-odx/core'
import { createError, defineEventHandler, getHeaders, getRequestURL, proxyRequest, readBody } from 'h3'
import { ofetch } from 'ofetch'
import { validateBtpAuth } from '../utils/auth'

const RE_QUERY_SPLIT = /\?/
const RE_TRAILING_SLASH = /\/$/
const RE_LEADING_SLASH = /^\//

/**
 * Handles incoming OData requests by proxying them to the resolved target destination.
 * Utilizes httpxy (via h3's proxyRequest) for native stream piping
 * or ofetch for buffering and response interception based on configuration.
 *
 * @param {import('h3').H3Event} event - The incoming H3 event.
 */
export default defineEventHandler(async (event): Promise<any> => {
  const startTime = Date.now()
  const trace = event.context.proxyTrace || []
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

  // Expose trace function for external utilities (like ODataGuard)
  event.context.proxyTrace = addTrace

  const config = event.context.odataConfig
  const useDevTools = config?.devtools?.enabled && process.env.NODE_ENV !== 'production'

  let serviceName = 'unknown'
  let targetUrl = ''
  let finalHeaders: Record<string, string> = {}
  let segments: string[] = []

  try {
    // 1. Enforce BTP Authentication in production environments
    if (process.env.NODE_ENV === 'production') {
      addTrace('Security', 'Validating BTP Authentication...')
      await validateBtpAuth(event)
      if (event.context.securityContext) {
        addTrace('Security', 'XSUAA Authentication successful', { user: event.context.securityContext.getLogonName() }, 'success')
      }
    }

    // 2. Extract Target Configuration
    const targetConfig = event.context.proxyTarget
    if (!targetConfig) {
      addTrace('Proxy', 'Proxy target configuration missing', null, 'error')
      throw createError({
        statusCode: 500,
        statusMessage: 'Proxy target configuration is missing in event context.',
      })
    }

    const basePath = config?.basePath || '/api/odx'
    const pathOnly = event.path.split(RE_QUERY_SPLIT)[0] || ''
    const relativePath = pathOnly.slice(basePath.length).replace(RE_LEADING_SLASH, '')
    segments = relativePath.split('/').filter(Boolean)
    const serviceRoute = segments[0] || ''

    // segments[0] is the service name (route), everything else is the OData resource
    const odataPath = segments.slice(1).join('/')
    const query = event.path.includes('?') ? `?${event.path.split(RE_QUERY_SPLIT)[1]}` : ''

    const matched = config?.services?.find((svc: any) =>
      svc.name.toLowerCase() === serviceRoute.toLowerCase()
      || (svc.route && svc.route.toLowerCase() === serviceRoute.toLowerCase()),
    )
    serviceName = matched?.name || serviceRoute

    // 3. Construct Target URL
    targetUrl = targetConfig.url.replace(RE_TRAILING_SLASH, '')
    if (targetConfig.isRelative) {
      targetUrl += `/${serviceName}`
    }
    targetUrl += `/${odataPath}${query}`

    if (targetUrl.startsWith('/')) {
      const url = getRequestURL(event)
      targetUrl = `${url.protocol}//${url.host}${targetUrl}`
    }

    addTrace('Proxy', `Forwarding request to: ${targetUrl}`)

    // 4. Prepare Headers & Execute Hooks
    const incomingHeaders = getHeaders(event)
    const serviceHeaders = matched?.headers || {}

    // Merge headers: Service Config (Defaults) < Incoming (Overrides)
    // We normalize keys to lowercase during merge to prevent duplicates
    finalHeaders = {}

    // 1. Apply Service Config Headers as defaults
    for (const [key, value] of Object.entries(serviceHeaders)) {
      finalHeaders[key.toLowerCase()] = value
    }

    // 2. Apply Incoming Headers (overrides defaults)
    for (const [key, value] of Object.entries(incomingHeaders)) {
      if (value !== undefined && value !== null) {
        finalHeaders[key.toLowerCase()] = String(value)
      }
    }

    // Remove restricted headers that should not be forwarded
    const restrictedHeaders = ['host', 'connection', 'content-length', 'content-encoding', 'transfer-encoding']
    for (const h of restrictedHeaders) {
      delete finalHeaders[h]
    }

    if (targetConfig.authHeader) {
      finalHeaders.Authorization = targetConfig.authHeader
    }

    const nitroApp = (event.context as any).nitroApp
    const hooks = config?.hooks || event.context.odataHooks || nitroApp?.hooks
    const isDirect = targetConfig.strategy === 'direct'

    if (hooks && !isDirect) {
      addTrace('Hooks', 'Executing proxy request hooks...')
      const fetchOptions = {
        method: event.method,
        headers: { ...finalHeaders },
      }
      await hooks.callHook('odx:proxy:request', { event, serviceName, fetchOptions })
      await hooks.callHook(`odx:proxy:request:${serviceName}`, { event, serviceName, fetchOptions })

      if (fetchOptions.headers) {
        Object.assign(finalHeaders, fetchOptions.headers)
      }
    }

    // 5. Proxy Execution (Hybrid Mode)
    // We use buffering mode (ofetch) if explicitly requested or devtools are enabled.
    const useBufferMode = targetConfig.proxyMode === 'buffer' || useDevTools

    if (useBufferMode) {
      let requestBody: any = null
      if (['POST', 'PUT', 'PATCH'].includes(event.method)) {
        requestBody = await readBody(event).catch(() => null)
      }

      try {
        const responseData = await ofetch(targetUrl, {
          method: event.method as any,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            ...finalHeaders,
          },
          body: requestBody,
          onResponse({ response }) {
            if (hooks?.callHook && !isDirect) {
              hooks.callHook('odx:proxy:response', { event, serviceName, response })
            }
          },
        })

        addTrace('Response', `Request successful (${event.method} ${event.path})`, { status: 200 }, 'success')

        if (useDevTools) {
          addODataLog({
            id: Math.random().toString(36).substring(7),
            timestamp: Date.now(),
            method: event.method,
            url: event.path,
            targetUrl,
            service: serviceName,
            entitySet: segments[1] || '',
            status: 200,
            duration: Date.now() - startTime,
            requestBody,
            requestHeaders: finalHeaders,
            responseBody: flattenOData(responseData),
            proxyTrace: [...trace],
          }, config.devtools?.maxLogs)
        }

        // Return raw response. SDK/Explorer handles flattening.
        // This ensures identical payload structure between stream and buffer mode.
        return responseData
      }
      catch (err: any) {
        const status = err.response?.status || 500
        addTrace('Response', `Backend request failed with status ${status}`, { error: err.message }, 'error')

        if (useDevTools) {
          addODataLog({
            id: Math.random().toString(36).substring(7),
            timestamp: Date.now(),
            method: event.method,
            url: event.path,
            targetUrl,
            service: serviceName,
            status,
            duration: Date.now() - startTime,
            requestBody,
            responseBody: { error: err.message },
            proxyTrace: [...trace],
          }, config.devtools?.maxLogs)
        }
        throw err
      }
    }

    // PRODUCTION/STREAMING: High performance streaming via httpxy
    // In this mode, we cannot capture the response body for devtools.
    if (useDevTools) {
      addODataLog({
        id: Math.random().toString(36).substring(7),
        timestamp: Date.now(),
        method: event.method,
        url: event.path,
        targetUrl,
        service: serviceName,
        entitySet: segments[1] || '',
        status: 200,
        duration: 0, // Duration is not easily measurable in streaming mode here
        requestHeaders: finalHeaders,
        responseBody: '[Streamed Response - Body not captured]',
        proxyTrace: [...trace],
      }, config.devtools?.maxLogs)
    }

    return proxyRequest(event, targetUrl, {
      headers: finalHeaders,
      cookieDomainRewrite: {
        '*': '',
      },
    })
  }
  catch (err: any) {
    const status = err.statusCode || err.status || 500
    const message = err.statusMessage || err.message || 'Internal Proxy Error'

    if (useDevTools) {
      addODataLog({
        id: Math.random().toString(36).substring(7),
        timestamp: Date.now(),
        method: event.method,
        url: event.path,
        targetUrl: targetUrl || 'N/A',
        service: serviceName,
        entitySet: segments[1] || '',
        status,
        duration: Date.now() - startTime,
        responseBody: { error: message },
        proxyTrace: [...trace],
      }, config?.devtools?.maxLogs)
    }

    throw err
  }
})
