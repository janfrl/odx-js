import fs from 'node:fs'
import { pathToFileURL } from 'node:url'
import { createError, defineEventHandler, getQuery, readBody, useRuntimeConfig, useStorage } from '#imports'
import { createJiti } from 'jiti'
import { join } from 'pathe'
import { addODataLog } from '../utils/dev-logs'

/**
 * Recursive flattener for OData V2 'results' structures and removes metadata.
 */
function flattenOData(data: any): any {
  if (!data || typeof data !== 'object')
    return data
  if (data.results && Array.isArray(data.results))
    return flattenOData(data.results)
  if (Array.isArray(data))
    return data.map(item => flattenOData(item))
  const flattened: any = {}
  for (const key in data) {
    if (key === '__metadata' || key === '__deferred')
      continue
    flattened[key] = flattenOData(data[key])
  }
  return Object.keys(flattened).length > 0 ? flattened : null
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

  const serializeLogBody = (data: any) => {
    if (!data)
      return data
    try {
      return flattenOData(data)
    }
    catch {
      return '[Non-serializable Data]'
    }
  }

  const logRequest = (status: number, responseBody?: any, requestBody?: any, targetUrl?: string) => {
    addODataLog({
      id: Math.random().toString(36).substring(7),
      timestamp: Date.now(),
      method: event.method || 'GET',
      url: fullPath,
      targetUrl,
      service: serviceRoute,
      entitySet: entitySetName,
      status,
      duration: Date.now() - startTime,
      requestBody: serializeLogBody(requestBody),
      responseBody: serializeLogBody(responseBody),
    })
  }

  const services = (config.odata?.services || []) as any[]
  const matched = services.find(svc => (svc.route || svc.name.toLowerCase()) === serviceRoute)

  if (!matched) {
    logRequest(404)
    throw createError({ statusCode: 404, message: `Unknown service "${serviceRoute}"` })
  }

  const storage = useStorage('odata:mockdata')
  const handleMockDataRequest = async () => {
    const method = event.method
    const query = getQuery(event)
    const mockDataKey = `${matched.name}:${entitySetName}.json`
    const data = (await storage.getItem(mockDataKey)) as any[] || []
    if (method === 'GET') {
      const id = resourceId || (query.id ? String(query.id) : undefined)
      if (id)
        return data.find((item: any) => String(item.ID || item.id) === id)
      return data
    }
    return data
  }

  let capturedBody: any = null
  let currentTargetUrl = 'unknown'

  try {
    if (['POST', 'PATCH', 'PUT'].includes(event.method)) {
      capturedBody = await readBody(event).catch(() => null)
    }

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

    if (getQuery(event).mock === 'true' || !targetFile) {
      const response = await handleMockDataRequest()
      logRequest(200, response, capturedBody)
      return response
    }

    const sdk = targetFile.endsWith('.ts') ? await jiti.import(targetFile) : await import(pathToFileURL(targetFile).href)

    // Find API factory
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
    if (!apiFactory)
      throw new Error(`API Factory not found for ${matched.name}`)

    let api: any
    try {
      api = (apiFactory.prototype && apiFactory.prototype.constructor) ? new (apiFactory as any)() : (apiFactory as any)()
    }
    catch {
      api = (apiFactory as any)()
    }

    // URL Logic
    const globalDest = (config.odata?.destination || '').replace(/\/$/, '')
    let baseUrl = (matched.url && matched.url.startsWith('http')) ? matched.url.replace(/\/$/, '') : globalDest

    if (!baseUrl) {
      const response = await handleMockDataRequest()
      logRequest(200, response, capturedBody)
      return response
    }

    // Auto-strip duplicate SAP paths
    if (baseUrl.includes('/sap/opu/odata/')) {
      baseUrl = baseUrl.split('/sap/opu/odata/')[0]!
    }

    currentTargetUrl = baseUrl

    // Destination Object
    const isTrustAll = config.odata?.rejectUnauthorized === false
    const destination: any = {
      url: baseUrl,
      isTrustingAllCertificates: isTrustAll,
    }

    const auth = matched.auth || config.odata?.auth || {}
    if (auth.bearerToken) {
      destination.authTokens = [{ value: auth.bearerToken }]
    }
    else if (auth.username && auth.password) {
      destination.username = auth.username
      destination.password = auth.password
    }

    const customHeaders: Record<string, string> = { ...config.odata?.headers, ...matched.headers }
    const whitelist = ['x-sap-client', 'sap-language', 'accept-language']
    for (const h of whitelist) {
      const val = event.headers.get(h)
      if (val)
        customHeaders[h] = val
    }

    // Entity API lookup
    const getAllKeys = (obj: any): string[] => {
      let keys: string[] = []
      let current = obj
      while (current && current !== Object.prototype) {
        keys = keys.concat(Object.getOwnPropertyNames(current))
        current = Object.getPrototypeOf(current)
      }
      return [...new Set(keys)]
    }
    const allKeys = getAllKeys(api)
    const actualKey = allKeys.find(k => k.toLowerCase() === entitySetName.toLowerCase() || k.toLowerCase() === `${entitySetName.toLowerCase()}api`)
    const entityApi = actualKey ? api[actualKey] : null
    if (!entityApi)
      throw new Error(`EntitySet ${entitySetName} not found`)

    const method = event.method
    const query = getQuery(event)

    if (method === 'GET') {
      const rb = resourceId ? entityApi.requestBuilder().getByKey(resourceId) : entityApi.requestBuilder().getAll()
      const customParams: Record<string, string> = {}
      for (const k in query) {
        if (k.startsWith('$'))
          customParams[k] = String(query[k])
      }
      if (Object.keys(customParams).length > 0)
        rb.addCustomQueryParameters(customParams)

      rb.addCustomHeaders(customHeaders)
      currentTargetUrl = await rb.url(destination).catch(() => baseUrl)

      const rawResponse = await rb.executeRaw(destination)
      let res = rawResponse.data
      if (res?.d)
        res = res.d.results || res.d
      else if (res?.value)
        res = res.value

      logRequest(200, res, capturedBody, currentTargetUrl)
      return flattenOData(res)
    }
    else if (method === 'POST') {
      const res = await entityApi.requestBuilder().create(capturedBody).addCustomHeaders(customHeaders).execute(destination)
      logRequest(201, res, capturedBody, currentTargetUrl)
      return res
    }

    throw createError({ statusCode: 405, message: 'Method Not Allowed' })
  }
  catch (err: any) {
    const response = await handleMockDataRequest()
    logRequest(err.response?.status || 500, {
      error: err.message,
      cause: err.cause?.message,
      backendError: err.response?.data,
    }, capturedBody, currentTargetUrl)
    return response
  }
})
