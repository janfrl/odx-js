import process from 'node:process'
import { flattenOData } from '@bc8-odx/core'
import { createError, defineEventHandler, getHeaders, proxyRequest, readBody } from 'h3'
import { ofetch } from 'ofetch'
import { validateBtpAuth } from '../utils/auth'
import { prepareProxyHeaders } from '../utils/headers'
import { DevToolsTracer } from '../utils/trace'
import { parseODataRequest, resolveTargetUrl } from '../utils/url'

/**
 * Handles incoming OData requests by proxying them to the resolved target destination.
 * Supports both streaming (high performance) and buffering (for DevTools/interception).
 */
export default defineEventHandler(async (event): Promise<any> => {
  const tracer = new DevToolsTracer(event)
  const config = event.context.odataConfig
  const targetConfig = event.context.proxyTarget

  if (!targetConfig) {
    tracer.addTrace('Proxy', 'Proxy target configuration missing', null, 'error')
    throw createError({
      statusCode: 500,
      statusMessage: 'Proxy target configuration is missing in event context.',
    })
  }

  try {
    // 1. Security Validation (Production Only)
    if (process.env.NODE_ENV === 'production') {
      tracer.addTrace('Security', 'Validating BTP Authentication...')
      await validateBtpAuth(event)
      if (event.context.securityContext) {
        tracer.addTrace('Security', 'XSUAA Authentication successful', { user: event.context.securityContext.getLogonName() }, 'success')
      }
    }

    // 2. Request Parsing & URL Resolution
    const request = parseODataRequest(event, config?.basePath)
    const matched = config?.services?.find((svc: any) =>
      svc.name.toLowerCase() === request.serviceName.toLowerCase()
      || (svc.route && svc.route.toLowerCase() === request.serviceName.toLowerCase()),
    )
    const serviceName = matched?.name || request.serviceName
    const targetUrl = resolveTargetUrl(event, targetConfig.url, request, targetConfig.isRelative, serviceName)

    tracer.addTrace('Proxy', `Forwarding request to: ${targetUrl}`)

    // 3. Header Preparation
    const finalHeaders = prepareProxyHeaders(getHeaders(event), matched?.headers, targetConfig.authHeader)

    // 4. Hook Execution
    const nitroApp = (event.context as any).nitroApp
    const hooks = config?.hooks || event.context.odataHooks || nitroApp?.hooks
    const isDirect = targetConfig.strategy === 'direct'

    if (hooks && !isDirect) {
      tracer.addTrace('Hooks', 'Executing proxy request hooks...')
      const fetchOptions = { method: event.method, headers: { ...finalHeaders } }
      await hooks.callHook('odx:proxy:request', { event, serviceName, fetchOptions })
      await hooks.callHook(`odx:proxy:request:${serviceName}`, { event, serviceName, fetchOptions })
      Object.assign(finalHeaders, fetchOptions.headers || {})
    }

    // 5. DevTools Logging Initialization
    let requestBody: any = null
    if (tracer.enabled && ['POST', 'PUT', 'PATCH'].includes(event.method)) {
      requestBody = await readBody(event).catch(() => null)
    }
    tracer.initLog(event, targetUrl, serviceName, request.segments[1] || '', requestBody, finalHeaders)

    // 6. Proxy Execution (Hybrid Mode)
    const mode = targetConfig.proxyMode || (tracer.enabled ? 'buffer' : 'stream')

    if (mode === 'buffer') {
      try {
        const responseData = await ofetch(targetUrl, {
          method: event.method as any,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            ...finalHeaders,
          },
          body: event.method !== 'GET' ? (requestBody || await readBody(event).catch(() => null)) : null,
          onResponse({ response }) {
            if (hooks?.callHook && !isDirect) {
              hooks.callHook('odx:proxy:response', { event, serviceName, response })
            }
          },
        })

        tracer.addTrace('Response', 'Request successful', { status: 200 }, 'success')
        tracer.updateLog(200, flattenOData(responseData))
        return responseData
      }
      catch (err: any) {
        const status = err.response?.status || 500
        tracer.addTrace('Response', `Backend request failed with status ${status}`, { error: err.message }, 'error')
        tracer.updateLog(status, { error: err.message })
        throw err
      }
    }

    // High Performance Streaming
    tracer.registerStreamFinish(event)
    return proxyRequest(event, targetUrl, {
      headers: finalHeaders,
      cookieDomainRewrite: { '*': '' },
    })
  }
  catch (err: any) {
    const status = err.statusCode || err.status || 500
    const message = err.statusMessage || err.message || 'Internal Proxy Error'
    tracer.updateLog(status, { error: message })
    throw err
  }
})
