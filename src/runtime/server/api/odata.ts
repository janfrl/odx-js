import { defineEventHandler, getQuery, useRuntimeConfig, createError, readBody } from '#imports'
import { join } from 'pathe'
import fs from 'node:fs'
import { pathToFileURL } from 'node:url'
import { createJiti } from 'jiti'
// @ts-expect-error - virtual file
import { addODataLog } from '../utils/dev-logs'

export default defineEventHandler(async (event) => {
  const startTime = Date.now()
  const config = useRuntimeConfig()
  const basePath = config.public?.odata?.basePath || '/api/sap-odata'
  const buildDir = config.odata?.buildDir as string

  const jiti = createJiti(import.meta.url)

  // Path extraction
  const fullPath = event.path || ''
  const [pathOnly] = fullPath.split('?')
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

  const subDirName = matched.route || matched.name.toLowerCase()
  const generatedDir = join(buildDir, 'sap-odata', 'generated', matched.name, subDirName)
  const indexFileTs = join(generatedDir, 'index.ts')
  const indexFileJs = join(generatedDir, 'index.js')

  const targetFile = fs.existsSync(indexFileTs) ? indexFileTs : (fs.existsSync(indexFileJs) ? indexFileJs : null)

  const getMockData = () => {
    logRequest(200)
    // Basic mock mapping for dev explorer
    const mockEntities: Record<string, any[]> = {
      exampleentities: [
        { id: '1', Name: 'Mock Item A', Price: 100, Currency: 'EUR' },
        { id: '2', Name: 'Mock Item B', Price: 250, Currency: 'EUR' }
      ],
      products: [
        { id: 'P1', Name: 'Notebook Professional', Category: 'Electronics' },
        { id: 'P2', Name: 'Office Desk', Category: 'Furniture' }
      ]
    }
    
    return mockEntities[entitySetName.toLowerCase()] || { 
      service: matched.name, 
      entitySet: entitySetName, 
      message: 'Mock data fallback (SDK missing or error)' 
    }
  }

  if (!targetFile) {
    return getMockData()
  }

  try {
    const sdk = targetFile.endsWith('.ts') 
      ? await jiti.import(targetFile) 
      : await import(pathToFileURL(targetFile).href)

    const apiFactoryName = `${matched.name}Api`
    const apiFactory = sdk[apiFactoryName]
    
    if (!apiFactory) {
      console.warn(`[nuxt-sap-odata] API Factory ${apiFactoryName} not found in SDK.`)
      return getMockData()
    }

    const api = apiFactory()
    const entityApi = api[entitySetName] || api[entitySetName.charAt(0).toLowerCase() + entitySetName.slice(1)]

    if (!entityApi) {
      return getMockData()
    }

    const method = event.method
    const query = getQuery(event)
    const destination = { url: config.odata?.destination || 'http://localhost:8080' }

    if (method === 'GET') {
      let rb = entityApi.requestBuilder().getAll()
      if (query.id) {
        rb = entityApi.requestBuilder().getByKey(query.id)
      } else {
        const odataParams: Record<string, string> = {}
        const keys = ['$filter', '$select', '$expand', '$top', '$skip', '$orderby']
        keys.forEach(key => { if (query[key]) odataParams[key] = String(query[key]) })
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
  catch (err: any) {
    console.error(`[nuxt-sap-odata] Proxy error for ${serviceRoute}/${entitySetName}:`, err.message)
    return getMockData()
  }
})
