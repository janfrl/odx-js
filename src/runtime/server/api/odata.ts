import fs from 'node:fs'
import { pathToFileURL } from 'node:url'
import { createError, defineEventHandler, getQuery, getRequestURL, readBody, useRuntimeConfig } from '#imports'
import { createJiti } from 'jiti'
import { join } from 'pathe'
import { withQuery } from 'ufo'
import { addODataLog } from '../utils/dev-logs'

/**
 * Recursive flattener for OData V2 'results' structures and removes metadata.
 */
function flattenOData(data: any): any {
  if (!data || typeof data !== 'object')
    return data

  // Handle OData V2 Count
  const count = data.__count || data['@odata.count'] || data.count

  if (data.results && Array.isArray(data.results)) {
    const flattened = data.results.map((item: any) => flattenOData(item))
    if (count !== undefined) {
      (flattened as any).totalCount = Number(count)
    }
    return flattened
  }

  if (Array.isArray(data))
    return data.map(item => flattenOData(item))

  const flattened: any = {}
  for (const key in data) {
    if (key === '__metadata' || key === '__deferred')
      continue
    flattened[key] = flattenOData(data[key])
  }
  return flattened
}

export default defineEventHandler(async (event) => {
  const startTime = Date.now()
  const config = useRuntimeConfig()
  const basePath = config.public?.odata?.basePath || '/api/sap-odata'
  const buildDir = config.odata?.buildDir as string
  const jiti = createJiti(import.meta.url)

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

  const services = (config.odata?.services || []) as any[]
  const matched = services.find(svc => (svc.route || svc.name.toLowerCase()) === serviceRoute)

  if (!matched) {
    throw createError({ statusCode: 404, message: `Unknown service "${serviceRoute}"` })
  }

  // Determine Target URL
  const globalDest = (config.odata?.destination || '').replace(/\/$/, '')
  let baseUrl = (matched.url && matched.url.startsWith('http')) ? matched.url.replace(/\/$/, '') : globalDest

  // If no external URL is set, we default to the internal mock server
  const isExternal = baseUrl.startsWith('http')
  if (!isExternal) {
    baseUrl = `/sap/opu/odata/sap/${matched.name}`
  }

  // Helper for logging
  const logRequest = (status: number, responseBody?: any, requestBody?: any, targetUrl?: string, requestHeaders?: Record<string, string>) => {
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
    })
  }

  let capturedBody: any = null
  if (['POST', 'PATCH', 'PUT'].includes(event.method)) {
    capturedBody = await readBody(event).catch(() => null)
  }

  try {
    // 1. Try to use SAP Cloud SDK for External Destinations
    if (isExternal) {
      const possibleDirs = [
        join(buildDir, 'sap-odata', 'generated', matched.name),
        join(buildDir, 'sap-odata', 'generated', matched.name, matched.route || matched.name.toLowerCase()),
      ]

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
        const sdk = targetFile.endsWith('.ts') ? await jiti.import(targetFile) : await import(pathToFileURL(targetFile).href)
        const possibleNames = [`${matched.name}Api`, `${serviceRoute}Api`, matched.name, serviceRoute]
        let apiFactory: any = null
        for (const name of possibleNames) {
          const found = Object.keys(sdk).find(k => k.toLowerCase() === name.toLowerCase())
          if (found && typeof sdk[found] === 'function') {
            apiFactory = sdk[found]
            break
          }
        }
        if (!apiFactory)
          apiFactory = Object.values(sdk).find(v => typeof v === 'function')

        if (apiFactory) {
          const api = (apiFactory.prototype && apiFactory.prototype.constructor) ? new (apiFactory as any)() : (apiFactory as any)()
          const allKeys = Object.keys(api).concat(Object.getOwnPropertyNames(Object.getPrototypeOf(api)))
          const actualKey = allKeys.find(k => k.toLowerCase() === entitySetName.toLowerCase() || k.toLowerCase() === `${entitySetName.toLowerCase()}api`)
          const entityApi = actualKey ? api[actualKey] : null

          if (entityApi) {
            const destination: any = {
              url: baseUrl.split('/sap/opu/odata/')[0],
              isTrustingAllCertificates: config.odata?.rejectUnauthorized === false,
            }
            const auth = matched.auth || config.odata?.auth || {}
            if (auth.bearerToken) {
              destination.authTokens = [{ value: auth.bearerToken }]
            }
            else if (auth.username && auth.password) { destination.username = auth.username; destination.password = auth.password }

            const customHeaders: Record<string, string> = { ...config.odata?.headers, ...matched.headers }
            const query = getQuery(event)

            if (event.method === 'GET') {
              const rb = resourceId ? entityApi.requestBuilder().getByKey(resourceId) : entityApi.requestBuilder().getAll()
              for (const k in query) {
                if (k.startsWith('$'))
                  rb.addCustomQueryParameters({ [k]: String(query[k]) })
              }
              rb.addCustomHeaders(customHeaders)
              const rawResponse = await rb.executeRaw(destination)
              const res = rawResponse.data?.d?.results || rawResponse.data?.d || rawResponse.data
              logRequest(200, res, capturedBody, await rb.url(destination).catch(() => baseUrl), customHeaders)
              return flattenOData(res)
            }
            else if (event.method === 'POST') {
              const res = await entityApi.requestBuilder().create(capturedBody).addCustomHeaders(customHeaders).execute(destination)
              logRequest(201, res, capturedBody, baseUrl, customHeaders)
              return res
            }
          }
        }
      }
    }

    // 2. Agnostic Fallback via $fetch (Internal Mock or Generic External)
    const requestUrl = `${baseUrl}/${entitySetName}${resourceId ? `(${resourceId})` : ''}`
    const query = getQuery(event)
    let fullTargetUrl = withQuery(requestUrl, query)

    // Make URL absolute for internal paths to improve log usability
    if (fullTargetUrl.startsWith('/')) {
      const origin = getRequestURL(event).origin
      fullTargetUrl = origin + fullTargetUrl
    }

    const response = await $fetch(requestUrl, {
      method: event.method,
      query,
      headers: { accept: 'application/json' },
    })

    const finalData = (response as any)?.d?.results || (response as any)?.d || response
    logRequest(200, finalData, capturedBody, fullTargetUrl)
    return flattenOData(finalData)
  }
  catch (err: any) {
    const query = getQuery(event)
    let errorUrl = withQuery(baseUrl, query)
    if (errorUrl.startsWith('/')) {
      const origin = getRequestURL(event).origin
      errorUrl = origin + errorUrl
    }
    logRequest(err.response?.status || 500, { error: err.message }, capturedBody, errorUrl)
    throw err
  }
})
