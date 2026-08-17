import type { H3Event } from 'h3'
import type { Hookable } from 'hookable'
import type { ODataProxyHooks } from '../types'
import { flattenOData, prepareSapCsrfHeaders } from '@me-tools/odx-core'
import { createError, defineEventHandler, getHeaders, proxyRequest, readBody, removeResponseHeader, setHeader, setResponseStatus } from 'h3'
import { ofetch } from 'ofetch'
import { prepareProxyHeaders } from '../utils/headers'
import { OdxProxyTelemetry, resolveOdxProxyTargetKind } from '../utils/operational-telemetry'
import { odataGuard } from '../utils/rules'
import { DevToolsTracer } from '../utils/trace'
import { parseODataRequest, resolveTargetUrl } from '../utils/url'

const ENTITY_SET_IDENTIFIER = /^[\w.]+/
const CSRF_PROTECTED_METHODS = new Set(['DELETE', 'MERGE', 'PATCH', 'POST', 'PUT'])
const BUFFERED_RESPONSE_HEADERS = ['etag', 'odata-version', 'preference-applied', 'sap-message'] as const

function omitManagedAuthorization(headers: Record<string, string>, authHeader?: string): void {
  if (authHeader && headers.authorization === authHeader) {
    delete headers.authorization
  }
}

function resolveCsrfPolicy(service: { csrf?: { mode?: unknown, fetchMethod?: unknown } } | undefined): {
  enabled: boolean
  fetchMethod?: 'GET' | 'HEAD'
} {
  const mode = service?.csrf?.mode
  const fetchMethod = service?.csrf?.fetchMethod

  if (mode !== undefined && mode !== 'none' && mode !== 'sap') {
    throw createError({
      statusCode: 500,
      statusMessage: 'Invalid OData CSRF mode in server configuration.',
    })
  }
  if (fetchMethod !== undefined && fetchMethod !== 'GET' && fetchMethod !== 'HEAD') {
    throw createError({
      statusCode: 500,
      statusMessage: 'Invalid OData CSRF fetch method in server configuration.',
    })
  }

  return {
    enabled: mode === 'sap',
    ...(fetchMethod ? { fetchMethod } : {}),
  }
}

function forwardBufferedResponseHeaders(event: H3Event, headers: Headers): void {
  for (const name of BUFFERED_RESPONSE_HEADERS) {
    const value = headers.get(name)
    if (value)
      setHeader(event, name, value)
  }

  const location = headers.get('location')
  if (location && !location.startsWith('//') && !URL.canParse(location))
    setHeader(event, 'location', location)
}

function removePrivateLocationHeader(event: H3Event, headers: Headers): void {
  const location = headers.get('location')
  if (location && (location.startsWith('//') || URL.canParse(location)))
    removeResponseHeader(event, 'location')
}

function removeBackendSessionHeaders(event: H3Event, headers: Headers): void {
  removePrivateLocationHeader(event, headers)
  if (headers.has('set-cookie'))
    removeResponseHeader(event, 'set-cookie')
}

async function readProxyRequestBody(event: H3Event): Promise<unknown> {
  if (event.method === 'GET' || event.method === 'HEAD')
    return null
  // H3's HTTPMethod type omits the OData V2 MERGE extension method.
  if ((event.method as string) === 'MERGE') {
    if (event.web?.request)
      return event.web.request.text()

    const decoder = new TextDecoder()
    let body = ''
    for await (const chunk of event.node.req) {
      body += chunk instanceof Uint8Array
        ? decoder.decode(chunk, { stream: true })
        : typeof chunk === 'string'
          ? chunk
          : JSON.stringify(chunk)
    }
    return body + decoder.decode()
  }
  return readBody(event).catch(() => null)
}

/**
 * Handles incoming OData requests by proxying them to the resolved target destination.
 * Supports both streaming (high performance) and buffering (for DevTools/interception).
 */
export default defineEventHandler(async (event): Promise<any> => {
  const config = event.context.odataConfig
  const tracer = new DevToolsTracer(event, config.telemetry?.enabled ? globalThis.crypto.randomUUID() : undefined)
  let telemetry: OdxProxyTelemetry | undefined
  const targetConfig = event.context.proxyTarget

  if (!targetConfig) {
    tracer.addTrace('Proxy', 'Proxy target configuration missing', null, 'error')
    throw createError({
      statusCode: 500,
      statusMessage: 'Proxy target configuration is missing in event context.',
    })
  }

  try {
    const nitroApp = (event.context as any).nitroApp
    const configuredHooks = config?.hooks as Hookable<ODataProxyHooks> | undefined
    const eventHooks = event.context.odataHooks as Hookable<ODataProxyHooks> | undefined
    const hooks = configuredHooks || eventHooks || nitroApp?.hooks
    const mode = targetConfig.proxyMode || (tracer.enabled ? 'buffer' : 'stream')

    // 1. Request Classification & Telemetry Initialization
    const request = parseODataRequest(event, config?.basePath)
    const matched = config?.services?.find((svc: any) =>
      svc.name.toLowerCase() === request.serviceName.toLowerCase()
      || (svc.route && svc.route.toLowerCase() === request.serviceName.toLowerCase()),
    )
    const serviceName = matched?.name || request.serviceName
    const entitySetId = request.segments[1]?.match(ENTITY_SET_IDENTIFIER)?.[0]
    telemetry = config.telemetry?.enabled
      ? new OdxProxyTelemetry(event, hooks, {
          requestId: tracer.id,
          serviceId: serviceName,
          ...(entitySetId ? { entitySetId } : {}),
          method: event.method,
          proxyMode: mode,
          targetKind: resolveOdxProxyTargetKind({
            destination: matched?.destination,
            isRelative: targetConfig.isRelative,
          }),
        })
      : undefined

    // Host authentication is supplied by an explicit runtime adapter. The
    // proxy handler only consumes the resulting security context.
    if (event.context.securityContext) {
      tracer.addTrace('Security', 'Host authentication successful', { user: event.context.securityContext.getLogonName?.() }, 'success')
    }
    let targetUrl = resolveTargetUrl(event, targetConfig.url, request, targetConfig.isRelative, serviceName)

    tracer.addTrace('Proxy', `Forwarding request to: ${targetUrl}`)

    // 3. Header Preparation
    const finalHeaders = prepareProxyHeaders(
      getHeaders(event),
      matched?.headers,
      targetConfig.authHeader,
      { forwardAuthorization: config.forwardAuthHeader !== false },
    )
    const loggedHeaders = { ...finalHeaders }
    omitManagedAuthorization(loggedHeaders, targetConfig.authHeader)

    // 4. DevTools Logging Initialization
    let requestBody: any = null
    if (tracer.enabled && CSRF_PROTECTED_METHODS.has(event.method)) {
      requestBody = await readProxyRequestBody(event)
    }
    await tracer.initLog(event, targetUrl, serviceName, request.segments[1] || '', requestBody, loggedHeaders)

    // 5. Rule & Hook Execution
    const isDirect = targetConfig.strategy === 'direct'
    const fetchOptions: any = { method: event.method, headers: { ...finalHeaders } }

    if (!isDirect) {
      const hookCtx = { event, serviceName, fetchOptions, url: targetUrl }
      const guard = odataGuard(hookCtx)

      // A. Programmatic Hooks (Nitro Plugins)
      if (hooks) {
        tracer.addTrace('Hooks', 'Executing proxy request hooks...')
        await hooks.callHook('odx:proxy:request', hookCtx)
        await hooks.callHook(`odx:proxy:request:${serviceName}`, hookCtx)
      }

      // B. Declarative Rules (from nuxt.config.ts)
      if (matched?.rules) {
        tracer.addTrace('Rules', 'Applying declarative configuration rules...')
        for (const rule of matched.rules) {
          guard.applyRule(rule)
        }
      }

      // Sync changes back from Guard/Hooks
      Object.assign(finalHeaders, fetchOptions.headers || {})
      Object.assign(loggedHeaders, finalHeaders)
      omitManagedAuthorization(loggedHeaders, targetConfig.authHeader)
      targetUrl = hookCtx.url || targetUrl
      await tracer.updateLogContext({ targetUrl, requestHeaders: loggedHeaders })
    }

    const csrfPolicy = resolveCsrfPolicy(matched)
    if (!isDirect && csrfPolicy.enabled && CSRF_PROTECTED_METHODS.has(event.method)) {
      try {
        const csrfHeaders = await prepareSapCsrfHeaders(targetUrl, {
          method: event.method,
          headers: finalHeaders,
          fetchMethod: csrfPolicy.fetchMethod,
        })
        Object.assign(finalHeaders, csrfHeaders)
        tracer.addTrace('CSRF', 'SAP mutation headers prepared', null, 'success')
      }
      catch {
        tracer.addTrace('CSRF', 'SAP mutation preflight failed', null, 'error')
        throw createError({
          statusCode: 502,
          statusMessage: 'SAP CSRF preflight failed.',
        })
      }
    }

    // 6. Proxy Execution (Hybrid Mode)

    if (mode === 'buffer') {
      try {
        let responseStatus = 200
        const responseData = await ofetch(targetUrl, {
          method: event.method as any,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            ...finalHeaders,
          },
          body: requestBody ?? await readProxyRequestBody(event),
          async onResponse({ response }) {
            responseStatus = response.status
            if (hooks?.callHook && !isDirect) {
              const hookCtx = { event, serviceName, response }
              await hooks.callHook('odx:proxy:response', hookCtx)
              await hooks.callHook(`odx:proxy:response:${serviceName}`, hookCtx)
            }
            forwardBufferedResponseHeaders(event, response.headers)
          },
        })

        setResponseStatus(event, responseStatus)
        tracer.addTrace('Response', 'Request successful', { status: responseStatus }, 'success')
        const responseLogBody = tracer.enabled && responseStatus !== 204
          ? flattenOData(responseData)
          : undefined
        await tracer.updateLog(responseStatus, responseLogBody)
        await telemetry?.complete(responseStatus)
        return responseStatus === 204 ? '' : responseData
      }
      catch (err: any) {
        const status = err.response?.status || 500
        tracer.addTrace('Response', `Backend request failed with status ${status}`, { error: err.message }, 'error')
        await tracer.updateLog(status, { error: err.message })
        // Re-throw as an h3 error so that the original SAP response body (e.g. permission
        // denied) is forwarded to the client instead of being swallowed by Nitro's error
        // serializer, which would strip the structured error payload.
        await telemetry?.complete(status)
        throw createError({ statusCode: status, data: err.data ?? null })
      }
    }

    // High Performance Streaming
    tracer.registerStreamFinish(event, async (status) => {
      await telemetry?.complete(status)
    })
    const streamFetchOptions = (event.method as string) === 'MERGE'
      ? {
          method: event.method,
          body: requestBody ?? await readProxyRequestBody(event),
        }
      : undefined

    return proxyRequest(event, targetUrl, {
      headers: finalHeaders,
      cookieDomainRewrite: { '*': '' },
      fetchOptions: streamFetchOptions,
      onResponse(responseEvent, response) {
        removeBackendSessionHeaders(responseEvent, response.headers)
      },
    })
  }
  catch (err: any) {
    const status = err.statusCode || err.status || 500
    const message = err.statusMessage || err.message || 'Internal Proxy Error'
    await tracer.updateLog(status, { error: message })
    await telemetry?.complete(status)
    throw err
  }
})
