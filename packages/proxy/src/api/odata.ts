import type { SapODataService } from '@bc8-odx/core'
import type { NitroRuntimeConfig } from './config'
import { Buffer } from 'node:buffer'
import fs from 'node:fs'
import { pathToFileURL } from 'node:url'
import { flattenOData } from '@bc8-odx/core'
import { createError, defineEventHandler, getQuery, getRequestURL, readBody } from 'h3'
import { createJiti } from 'jiti'
import { useRuntimeConfig } from 'nitropack/runtime'
import { join } from 'pathe'
import { withQuery } from 'ufo'
import { addODataLog } from '../utils/dev-logs'

export default defineEventHandler(async (event) => {
  const startTime = Date.now()
  const config = useRuntimeConfig(event) as unknown as NitroRuntimeConfig
  const basePath = config.public.odata?.basePath || '/api/sap-odata'
  const buildDir = config.odata?.buildDir ?? ''

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

  const services: SapODataService[] = config.odata?.services ?? []
  const matched = services.find(svc =>
    svc.name.toLowerCase() === serviceRoute.toLowerCase()
    || (svc.route && svc.route.toLowerCase() === serviceRoute.toLowerCase()),
  )

  if (!matched) {
    throw createError({ statusCode: 404, message: `Unknown service "${serviceRoute}"` })
  }

  const globalDest = (config.odata?.destination || '').replace(/\/$/, '')
  let baseUrl = (matched.url && matched.url.startsWith('http')) ? matched.url.replace(/\/$/, '') : globalDest

  const isExternal = baseUrl.startsWith('http')
  if (!isExternal) {
    baseUrl = `/sap/opu/odata/sap/${matched.name}`
  }

  const customHeaders: Record<string, string> = { ...config.odata?.headers, ...matched.headers }
  const auth = matched.auth || config.odata?.auth || {}
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
    })
  }

  let capturedBody: unknown = null
  if (['POST', 'PATCH', 'PUT'].includes(event.method)) {
    capturedBody = await readBody(event).catch(() => null)
  }

  try {
    if (isExternal) {
      const jiti = createJiti(import.meta.url)
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
              url: baseUrl.split('/sap/opu/odata/')[0],
              isTrustingAllCertificates: config.odata?.rejectUnauthorized === false,
              username: '',
              password: '',
              authTokens: [] as { value: string }[],
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
            const query = getQuery(event)

            if (event.method === 'GET') {
              const rb = resourceId ? entityApi.requestBuilder().getByKey(resourceId) : entityApi.requestBuilder().getAll()
              for (const k in query) {
                if (k.startsWith('$')) {
                  rb.addCustomQueryParameters({ [k]: String(query[k]) })
                }
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

    const requestUrl = `${baseUrl}/${entitySetName}${resourceId ? `(${resourceId})` : ''}`
    const query = getQuery(event)
    let fullTargetUrl = withQuery(requestUrl, query)

    if (fullTargetUrl.startsWith('/')) {
      try {
        const origin = getRequestURL(event).origin
        fullTargetUrl = origin + fullTargetUrl
      }
      catch {
      }
    }

    const response = await $fetch(requestUrl, {
      method: event.method as 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
      query,
      headers: {
        accept: 'application/json',
        ...customHeaders,
      },
    })

    const data = response as Record<string, any>
    const finalData = data?.d?.results || data?.d || data
    logRequest(200, finalData, capturedBody, fullTargetUrl)
    return flattenOData(finalData)
  }
  catch (err: unknown) {
    const error = err as { response?: { status?: number }, message: string }
    const query = getQuery(event)
    let errorUrl = withQuery(baseUrl, query)
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
