import type { ODataProxyConfig, ODataServiceConfig } from '@bc8-odx/core'
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

export default defineEventHandler(async (event) => {
  const startTime = Date.now()

  // Enforce BTP Authentication
  await validateBtpAuth(event)

  const config = event.context.odataConfig as ODataProxyConfig

  // Retrieve runtime hooks:
  // 1. Explicitly passed in config (for tests)
  // 2. Injected via middleware (for Nuxt app)
  // 3. From Nitro app instance (fallback)
  const nitroApp = (event.context as any).nitroApp
  const hooks = config?.hooks || event.context.odataHooks || nitroApp?.hooks

  if (!config) {
    throw createError({ statusCode: 500, message: '[@bc8-odx/proxy] Proxy configuration missing in context' })
  }

  // Robustly handle self-signed certificates globally for the process if disabled in config
  if (config.rejectUnauthorized === false) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
  }

  const basePath = config.basePath || '/api/odx'
  const buildDir = config.buildDir ?? ''

  const fullPath = event.path || ''
  const pathOnly = fullPath.split('?')[0] || ''
  const relativePath = pathOnly.startsWith(basePath) ? pathOnly.slice(basePath.length).replace(/^\//, '') : ''
  const segments = relativePath.split('/').filter(Boolean)
  const serviceRoute = segments[0] || ''
  let entitySetName = segments[1] || ''
  let resourceId = ''

  if (entitySetName.includes('(')) {
    const match = entitySetName.match(/^([^(]+)\(([^)]+)\)$/)
    if (match) {
      entitySetName = match[1]!
      resourceId = match[2]!.replace(/^'|'$/g, '')
    }
  }

  const services: ODataServiceConfig[] = config.services ?? []
  const matched = services.find(svc =>
    svc.name.toLowerCase() === serviceRoute.toLowerCase()
    || (svc.route && svc.route.toLowerCase() === serviceRoute.toLowerCase()),
  )

  if (!matched) {
    throw createError({ statusCode: 404, message: `Unknown service "${serviceRoute}"` })
  }

  const globalDest = (config.destination || '').replace(/\/$/, '')
  let baseUrl = (matched.url || globalDest).replace(/\/$/, '')

  const isExternal = baseUrl.startsWith('http')
  if (!isExternal) {
    // Standard SAP path for non-external services
    baseUrl = `/sap/opu/odata/sap/${matched.name}`
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
  if (auth.bearerToken && !customHeaders.authorization) {
    customHeaders.authorization = `Bearer ${auth.bearerToken}`
  }
  else if (auth.username && auth.password && !customHeaders.authorization) {
    customHeaders.authorization = `Basic ${Buffer.from(`${auth.username}:${auth.password}`).toString('base64')}`
  }

  const logRequest = (status: number, responseBody?: unknown, requestBody?: unknown, targetUrl?: string, requestHeaders?: Record<string, string>): void => {
    addODataLog({
      id: Math.random().toString(36).substring(7),
      timestamp: Date.now(),
      method: event.method || 'GET',
      url: fullPath,
      targetUrl: targetUrl || baseUrl,
      service: serviceRoute,
      entitySet: entitySetName,
      status,
      duration: Date.now() - startTime,
      requestBody,
      requestHeaders,
      responseBody: flattenOData(responseBody),
    }, config.devtools?.maxLogs)
  }

  let capturedBody: unknown = null
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

  const query = getQuery(event)
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
      if (hooks?.callHook) {
        hooks.callHook('odx:proxy:response', { event, serviceName: matched.name, response })
        hooks.callHook(`odx:proxy:response:${matched.name}`, { event, serviceName: matched.name, response })
      }
    },
  }

  if (config.rejectUnauthorized === false) {
    fetchOptions.agent = new https.Agent({ rejectUnauthorized: false })
  }

  // TRIGGER REQUEST HOOKS (Now unified before either path is taken)
  if (hooks) {
    if (typeof hooks.callHook === 'function') {
      await hooks.callHook('odx:proxy:request', { event, serviceName: matched.name, fetchOptions })
      await hooks.callHook(`odx:proxy:request:${matched.name}`, { event, serviceName: matched.name, fetchOptions })
    }
  }

  // Update headers from hooks if they were modified
  const finalHeaders = { ...fetchOptions.headers as Record<string, string> }

  try {
    if (isExternal && buildDir && matched.name !== 'TestService') {
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
            const allKeys = Object.keys(api).concat(Object.getOwnPropertyNames(Object.getPrototypeOf(api)))
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

    let requestUrl = `${baseUrl}/${entitySetName}${resourceId ? `(${resourceId})` : ''}`
    let fullTargetUrl = withQuery(requestUrl, query)

    if (requestUrl.startsWith('/')) {
      try {
        const origin = getRequestURL(event).origin
        requestUrl = origin + requestUrl
        fullTargetUrl = origin + fullTargetUrl
      }
      catch {
      }
    }

    // Pass final headers to fetchWithCsrf
    fetchOptions.headers = finalHeaders
    const response = await fetchWithCsrf(requestUrl, fetchOptions)

    const data = response as Record<string, any>
    const finalData = data?.d?.results || data?.d || data
    logRequest(200, finalData, capturedBody, fullTargetUrl)
    return finalData
  }
  catch (err: any) {
    const error = err as { response?: { status?: number }, message: string }
    const q = getQuery(event)
    let errorUrl = withQuery(baseUrl, q)
    if (errorUrl.startsWith('/')) {
      try {
        const origin = getRequestURL(event).origin
        errorUrl = origin + errorUrl
      }
      catch {
      }
    }
    logRequest(error.response?.status || 500, { error: error.message }, capturedBody, errorUrl)
    throw err
  }
})
