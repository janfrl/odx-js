import type { ODataProxyConfig, ODataServiceConfig, ProxyTraceEntry } from '@bc8-odx/core'
import type { FetchOptions, FetchResponse } from 'ofetch'
import { Buffer } from 'node:buffer'
import fs from 'node:fs'
import https from 'node:https'
import process from 'node:process'
import { pathToFileURL } from 'node:url'
import { addODataLog, fetchWithCsrf, flattenOData } from '@bc8-odx/core'
import { createError, defineEventHandler, getHeaders, getQuery, getRequestURL, readBody } from 'h3'
import { join } from 'pathe'
import { withQuery } from 'ufo'
import { validateBtpAuth } from '../utils/auth'

const RE_LEADING_SLASH = /^\//
const RE_ENTITY_SET_MATCH = /^([^(]+)\(([^)]+)\)$/
const RE_QUOTE_WRAP = /^'|'$/g
const RE_TRAILING_SLASH = /\/$/

export default defineEventHandler(async (event) => {
  const startTime = Date.now()
  const trace: ProxyTraceEntry[] = []

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

  event.context.proxyTrace = addTrace

  const config = event.context.odataConfig as ODataProxyConfig

  const fullPath = event.path || ''
  const pathOnly = fullPath.split('?')[0] || ''
  const basePath = config.basePath || '/api/odx'
  const relativePath = pathOnly.startsWith(basePath) ? pathOnly.slice(basePath.length).replace(RE_LEADING_SLASH, '') : ''
  const segments = relativePath.split('/').filter(Boolean)
  const serviceRoute = segments[0] || ''

  const logRequest = (status: number, responseBody?: unknown, requestBody?: unknown, targetUrl?: string, requestHeaders?: Record<string, string>): void => {
    const totalDuration = Date.now() - startTime
    addTrace('Response', `Request finished with status ${status}`, { duration: `${totalDuration}ms` }, status < 400 ? 'success' : 'error')

    addODataLog({
      id: Math.random().toString(36).substring(7),
      timestamp: Date.now(),
      method: event.method || 'GET',
      url: fullPath,
      targetUrl: targetUrl || '',
      service: serviceRoute,
      entitySet: segments[1] || '',
      status,
      duration: totalDuration,
      requestBody,
      requestHeaders,
      responseBody: flattenOData(responseBody),
      proxyTrace: [...trace],
    }, config.devtools?.maxLogs)
  }

  let capturedBody: unknown = null
  let baseUrl = ''

  try {
    addTrace('Request', `${event.method} ${relativePath}`, { fullPath })

    // Enforce BTP Authentication
    if (process.env.NODE_ENV === 'production') {
      addTrace('Security', 'Validating BTP Authentication...')
      await validateBtpAuth(event)
      if (event.context.securityContext) {
        addTrace('Security', 'XSUAA Authentication successful', { user: event.context.securityContext.getLogonName() }, 'success')
      }
    }

    // Retrieve runtime hooks:
    const nitroApp = (event.context as any).nitroApp
    const hooks = config?.hooks || event.context.odataHooks || nitroApp?.hooks

    if (!config) {
      throw createError({ statusCode: 500, message: '[@bc8-odx/proxy] Proxy configuration missing in context' })
    }

    // Robustly handle self-signed certificates globally for the process if disabled in config
    if (config.rejectUnauthorized === false) {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
    }

    const buildDir = config.buildDir ?? ''
    let entitySetName = segments[1] || ''
    let resourceId = ''

    if (entitySetName.includes('(')) {
      const match = entitySetName.match(RE_ENTITY_SET_MATCH)
      if (match) {
        entitySetName = match[1]!
        resourceId = match[2]!.replace(RE_QUOTE_WRAP, '')
      }
    }

    const query = getQuery(event)

    // Use 'id' from query if resourceId is empty
    if (!resourceId && query.id) {
      resourceId = String(query.id)
      delete query.id
    }

    const services: ODataServiceConfig[] = config.services ?? []
    const matched = services.find(svc =>
      svc.name.toLowerCase() === serviceRoute.toLowerCase()
      || (svc.route && svc.route.toLowerCase() === serviceRoute.toLowerCase()),
    )

    if (!matched) {
      throw createError({ statusCode: 404, message: `Unknown service "${serviceRoute}"` })
    }

    const isDirect = matched.strategy === 'direct'

    // --- START PROXY ENGINE LOGIC ---
    if (isDirect) {
      addTrace('Proxy', 'Service strategy is "direct". Bypassing Security and Hooks (CORS Bridge Mode).')
    }

    const globalDest = (config.destination || '').replace(RE_TRAILING_SLASH, '')
    baseUrl = (matched.url || globalDest).replace(RE_TRAILING_SLASH, '')

    const isExternal = baseUrl.startsWith('http')
    if (!isExternal) {
      // Standard SAP path for non-external services
      baseUrl = `/sap/opu/odata/sap/${matched.name}`

      // Prepend the current origin if baseUrl is relative (important for ofetch in server-side)
      const url = getRequestURL(event)
      baseUrl = `${url.protocol}//${url.host}${baseUrl}`
    }

    const incomingHeaders = getHeaders(event)
    const headersToForward: Record<string, string> = {}

    const skipHeaders = ['host', 'connection', 'content-length', 'content-type', 'accept', 'accept-encoding', 'cookie']
    for (const [key, value] of Object.entries(incomingHeaders)) {
      if (value && !skipHeaders.includes(key.toLowerCase())) {
        headersToForward[key] = value
      }
    }

    const customHeaders: Record<string, string> = {
      ...config.headers,
      ...matched.headers,
      ...headersToForward,
    }

    const auth = matched.auth || config.auth || {}
    if (!isDirect) {
      if (auth.bearerToken && !customHeaders.authorization) {
        customHeaders.authorization = `Bearer ${auth.bearerToken}`
      }
      else if (auth.username && auth.password && !customHeaders.authorization) {
        customHeaders.authorization = `Basic ${Buffer.from(`${auth.username}:${auth.password}`).toString('base64')}`
      }
    }

    if (['POST', 'PATCH', 'PUT'].includes(event.method)) {
      capturedBody = await readBody(event).catch(() => null)
      if (capturedBody && typeof capturedBody === 'string') {
        try {
          capturedBody = JSON.parse(capturedBody)
        }
        catch {
        }
      }
    }

    const fetchOptions: FetchOptions = {
      method: event.method as any,
      query,
      body: capturedBody as any,
      headers: {
        'content-type': 'application/json',
        'accept': 'application/json',
        ...customHeaders,
      },
      onResponse({ response }: { response: FetchResponse<any> }) {
        if (!isDirect && hooks?.callHook) {
          hooks.callHook('odx:proxy:response', { event, serviceName: matched.name, response })
          hooks.callHook(`odx:proxy:response:${matched.name}`, { event, serviceName: matched.name, response })
        }
      },
    }

    if (config.rejectUnauthorized === false) {
      fetchOptions.agent = new https.Agent({ rejectUnauthorized: false })
    }

    // TRIGGER REQUEST HOOKS (Only if not direct)
    if (!isDirect && hooks) {
      if (typeof hooks.callHook === 'function') {
        addTrace('Hooks', 'Executing global request hooks...')
        await hooks.callHook('odx:proxy:request', { event, serviceName: matched.name, fetchOptions })
        addTrace('Hooks', `Executing service request hooks for "${matched.name}"...`)
        await hooks.callHook(`odx:proxy:request:${matched.name}`, { event, serviceName: matched.name, fetchOptions })
      }
    }

    // Update headers from hooks if they were modified
    const finalHeaders = { ...fetchOptions.headers as Record<string, string> }

    if (!isDirect && isExternal && buildDir && matched.name !== 'TestService') {
      const sdkDir = join(buildDir, 'odx', 'generated', matched.name)
      if (fs.existsSync(sdkDir)) {
        const { createJiti } = await import('jiti')
        const jiti = createJiti(import.meta.url)
        const possibleDirs = [sdkDir, join(sdkDir, matched.route || matched.name.toLowerCase())]

        let targetFile: string | null = null
        for (const dir of possibleDirs) {
          if (fs.existsSync(join(dir, 'index.ts'))) {
            targetFile = join(dir, 'index.ts')
            break
          }
          if (fs.existsSync(join(dir, 'index.js'))) {
            targetFile = join(dir, 'index.js')
            break
          }
        }

        if (targetFile) {
          const sdk = (targetFile.endsWith('.ts') ? await jiti.import(targetFile) : await import(pathToFileURL(targetFile).href)) as Record<string, any>
          const possibleNames = [`${matched.name}Api`, `${serviceRoute}Api`, matched.name, serviceRoute]
          let apiFactory: any = null
          for (const name of possibleNames) {
            const found = Object.keys(sdk).find(k => k.toLowerCase() === name.toLowerCase())
            if (found && typeof sdk[found] === 'function') {
              apiFactory = sdk[found]
              break
            }
          }
          if (!apiFactory) {
            apiFactory = Object.values(sdk).find(v => typeof v === 'function')
          }

          if (apiFactory) {
            const api = (apiFactory.prototype && apiFactory.prototype.constructor) ? new (apiFactory as any)() : (apiFactory as any)()
            const allKeys = [...Object.keys(api), ...Object.getOwnPropertyNames(Object.getPrototypeOf(api))]
            const actualKey = allKeys.find(k => k.toLowerCase() === entitySetName.toLowerCase() || k.toLowerCase() === `${entitySetName.toLowerCase()}api`)
            const entityApi = actualKey ? api[actualKey] : null

            if (entityApi) {
              const destination = {
                url: baseUrl.split('/sap/opu/odata/')[0]!,
                isTrustingAllCertificates: config.rejectUnauthorized === false,
                username: '',
                password: '',
                authTokens: [] as { value: string }[],
              }
              if (auth.bearerToken) {
                destination.authTokens = [{ value: auth.bearerToken }]
              }
              else if (auth.username && auth.password) {
                destination.username = auth.username
                destination.password = auth.password
              }

              if (event.method === 'GET') {
                const rb = resourceId ? entityApi.requestBuilder().getByKey(resourceId) : entityApi.requestBuilder().getAll()
                for (const k in query) {
                  if (k.startsWith('$')) {
                    rb.addCustomQueryParameters({ [k]: String(query[k]) })
                  }
                }
                rb.addCustomHeaders(finalHeaders)
                const rawResponse = await rb.executeRaw(destination)
                const res = rawResponse.data?.d?.results || rawResponse.data?.d || rawResponse.data
                logRequest(200, res, capturedBody, await rb.url(destination).catch(() => baseUrl), finalHeaders)
                return res
              }
              else if (event.method === 'POST') {
                const res = await entityApi.requestBuilder().create(capturedBody).addCustomHeaders(finalHeaders).execute(destination)
                logRequest(201, res, capturedBody, baseUrl, finalHeaders)
                return res
              }
            }
          }
        }
      }
    }

    const requestUrl = `${baseUrl}/${entitySetName}${resourceId ? `(${resourceId})` : ''}`
    const fullTargetUrl = withQuery(requestUrl, query)

    addTrace('Proxy', `Forwarding request to: ${fullTargetUrl}`)

    fetchOptions.headers = finalHeaders
    const response = await fetchWithCsrf(requestUrl, fetchOptions)

    const data = response as Record<string, any>
    addTrace('Data', 'Flattening OData response structure')
    const finalData = data?.d?.results || data?.d || data
    logRequest(200, finalData, capturedBody, fullTargetUrl)
    return finalData
  }
  catch (err: any) {
    const error = err as { response?: { status?: number }, message: string }
    const status = error.response?.status || 500

    // Log trace even on failure
    logRequest(status, { error: error.message }, capturedBody, baseUrl)
    throw err
  }
})
