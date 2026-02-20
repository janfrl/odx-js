import { defineEventHandler, getQuery, useRuntimeConfig, createError, readBody, useStorage } from '#imports'
import { join } from 'pathe'
import fs from 'node:fs'
import { pathToFileURL } from 'node:url'
import { createJiti } from 'jiti'
import { addODataLog } from '../utils/dev-logs'

export default defineEventHandler(async (event) => {
  const startTime = Date.now()
  const config = useRuntimeConfig()
  const basePath = config.public?.odata?.basePath || '/api/sap-odata'
  const buildDir = config.odata?.buildDir as string

  const jiti = createJiti(import.meta.url)

  // Path extraction
  const fullPath = event.path || ''
  const pathOnly = fullPath.split('?')[0] || ''
  const relativePath = pathOnly.startsWith(basePath)
    ? pathOnly.slice(basePath.length).replace(/^\//, '')
    : ''

  const segments = relativePath.split('/').filter(Boolean)
  const serviceRoute = segments[0] || ''
  const entitySetName = segments[1] || ''

  const logRequest = (status: number) => {
    addODataLog({
      id: Math.random().toString(36).substring(7),
      timestamp: Date.now(),
      method: event.method || 'GET',
      url: fullPath,
      service: serviceRoute,
      entitySet: entitySetName,
      status,
      duration: Date.now() - startTime,
    })
  }

  const services = (config.odata?.services || []) as Array<{ name: string, route?: string }>
  const matched = services.find(
    svc => (svc.route || svc.name.toLowerCase()) === serviceRoute,
  )

  if (!matched) {
    logRequest(404)
    throw createError({ statusCode: 404, statusMessage: `Unknown service "${serviceRoute}"` })
  }

  const storage = useStorage('odata:mocks')
  
  const handleMockRequest = async () => {
    const method = event.method
    const query = getQuery(event)
    const mockKeyColon = `${matched.name}:${entitySetName}.json`
    const mockKeySlash = `${matched.name}/${entitySetName}.json`
    
    // Helper to find the actual key used in storage
    const activeKey = (await storage.hasItem(mockKeyColon)) ? mockKeyColon : mockKeySlash
    let data = (await storage.getItem(activeKey)) as any[] || []

    if (!Array.isArray(data)) {
      // If it's not an array, we can't easily do CRUD mocks on it
      if (method === 'GET') { logRequest(200); return data }
      throw createError({ statusCode: 400, statusMessage: 'Mock data must be an array for CRUD operations' })
    }

    if (method === 'GET') {
      logRequest(200)
      if (query.id) {
        return data.find((item: any) => String(item.ID || item.id) === String(query.id))
      }
      return data
    }

    if (method === 'POST') {
      const body = await readBody(event).catch(() => null)
      if (!body || typeof body !== 'object') {
        throw createError({ statusCode: 400, statusMessage: 'Invalid or missing JSON body for POST' })
      }

      const newItem = { ...body }
      // Simple ID generation if missing
      if (!newItem.ID && !newItem.id) {
        newItem.ID = Math.random().toString(36).substring(7).toUpperCase()
      }
      
      data.push(newItem)
      await storage.setItem(activeKey, data)
      logRequest(201)
      return newItem
    }

    if (method === 'PATCH' || method === 'PUT') {
      const body = await readBody(event).catch(() => null)
      const id = query.id || (body && (body.ID || body.id))
      
      if (!id) {
        throw createError({ statusCode: 400, statusMessage: 'Missing Item ID for update (provide via ?id= or in body)' })
      }
      if (!body || typeof body !== 'object') {
        throw createError({ statusCode: 400, statusMessage: 'Invalid or missing JSON body for update' })
      }

      const index = data.findIndex((item: any) => String(item.ID || item.id) === String(id))
      if (index === -1) {
        throw createError({ statusCode: 404, statusMessage: `Item with ID "${id}" not found in mocks` })
      }
      
      data[index] = { ...data[index], ...body }
      await storage.setItem(activeKey, data)
      logRequest(200)
      return data[index]
    }

    if (method === 'DELETE') {
      const id = query.id
      if (!id) {
        throw createError({ statusCode: 400, statusMessage: 'Missing Item ID for deletion (provide via ?id=)' })
      }

      const initialLength = data.length
      data = data.filter((item: any) => String(item.ID || item.id) !== String(id))
      
      if (data.length === initialLength) {
        throw createError({ statusCode: 404, statusMessage: `Item with ID "${id}" not found in mocks` })
      }
      
      await storage.setItem(activeKey, data)
      logRequest(204)
      return { success: true }
    }

    throw createError({ statusCode: 405, statusMessage: 'Method Not Allowed in Mock Mode' })
  }

  // Check if we should force mock (optional, could be a header or query param)
  const forceMock = getQuery(event).mock === 'true'
  if (forceMock) {
    return await handleMockRequest()
  }

  const subDirName = matched.route || matched.name.toLowerCase()
  const generatedDir = join(buildDir, 'sap-odata', 'generated', matched.name, subDirName)
  const indexFileTs = join(generatedDir, 'index.ts')
  const indexFileJs = join(generatedDir, 'index.js')

  const targetFile = fs.existsSync(indexFileTs) ? indexFileTs : (fs.existsSync(indexFileJs) ? indexFileJs : null)

  if (!targetFile) {
    return await handleMockRequest()
  }

  try {
    const sdk = targetFile.endsWith('.ts')
      ? await jiti.import(targetFile)
      : await import(pathToFileURL(targetFile).href)

    const apiFactoryName = `${matched.name}Api`
    const apiFactory = sdk[apiFactoryName]

    if (!apiFactory) {
      console.warn(`[nuxt-sap-odata] API Factory ${apiFactoryName} not found in SDK.`)
      return await handleMockRequest()
    }

    const api = apiFactory()
    const entityApi = api[entitySetName] || api[entitySetName.charAt(0).toLowerCase() + entitySetName.slice(1)]

    if (!entityApi) {
      return await handleMockRequest()
    }

    const method = event.method
    const query = getQuery(event)
    const destination = { url: config.odata?.destination || 'http://localhost:8080' }

    if (method === 'GET') {
      let rb = entityApi.requestBuilder().getAll()
      if (query.id) {
        rb = entityApi.requestBuilder().getByKey(query.id)
      }
      else {
        const odataParams: Record<string, string> = {}
        const keys = ['$filter', '$select', '$expand', '$top', '$skip', '$orderby']
        keys.forEach((key) => {
          if (query[key]) odataParams[key] = String(query[key])
        })
        if (Object.keys(odataParams).length > 0) rb = rb.withCustomParameters(odataParams)
      }
      const res = await rb.execute(destination)
      logRequest(200)
      return res
    }

    if (method === 'POST') {
      const body = await readBody(event)
      const res = await entityApi.requestBuilder().create(body).execute(destination)
      logRequest(201)
      return res
    }

    if (method === 'PATCH') {
      const body = await readBody(event)
      const res = await entityApi.requestBuilder().update(body).execute(destination)
      logRequest(200)
      return res
    }

    if (method === 'DELETE') {
      const id = query.id as string
      const res = await entityApi.requestBuilder().delete(id).execute(destination)
      logRequest(204)
      return res
    }

    throw createError({ statusCode: 405, statusMessage: 'Method Not Allowed' })
  }
  catch (err: unknown) {
    const error = err as Error
    console.error(`[nuxt-sap-odata] Proxy error for ${serviceRoute}/${entitySetName}:`, error.message)
    return await getMockData()
  }
})
