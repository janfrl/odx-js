import { defineEventHandler, getQuery, useRuntimeConfig, createError, readBody } from '#imports'
import { join } from 'pathe'
import fs from 'node:fs'
import { pathToFileURL } from 'node:url'
// @ts-ignore
import { addODataLog } from '../utils/dev-logs'

export default defineEventHandler(async (event) => {
  const startTime = Date.now()
  const config = useRuntimeConfig()
  const basePath = config.public?.odata?.basePath || '/api/sap-odata'
  const buildDir = config.odata?.buildDir as string

  const url = event.node.req.url || ''
  const [path] = url.split('?')
  
  // Extract service and entity set
  const relativePath = path.startsWith(basePath + '/') 
    ? path.slice((basePath + '/').length) 
    : ''
  
  const segments = relativePath.split('/').filter(Boolean)
  const serviceRoute = segments[0] || ''
  const entitySetName = segments[1] || ''

  const logRequest = (status: number) => {
    addODataLog({
      id: Math.random().toString(36).substring(7),
      timestamp: Date.now(),
      method: event.node.req.method || 'GET',
      url,
      service: serviceRoute,
      entitySet: entitySetName,
      status,
      duration: Date.now() - startTime
    })
  }

  const services = (config.odata?.services || []) as Array<{ name: string; route?: string }>
  const matched = services.find(
    (svc) => (svc.route || svc.name.toLowerCase()) === serviceRoute
  )

  if (!matched) {
    logRequest(404)
    throw createError({
      statusCode: 404,
      statusMessage: `Unknown service "${serviceRoute}"`,
    })
  }

  const generatedDir = join(
    buildDir,
    'sap-odata',
    'generated',
    matched.name
  )
  
  // Robustly find index.js (handle possible subfolder)
  let indexFile = join(generatedDir, 'index.js')
  if (!fs.existsSync(indexFile) && fs.existsSync(generatedDir)) {
    const subdirs = fs.readdirSync(generatedDir).filter(f => fs.statSync(join(generatedDir, f)).isDirectory())
    for (const subdir of subdirs) {
      const potentialIndex = join(generatedDir, subdir, 'index.js')
      if (fs.existsSync(potentialIndex)) {
        indexFile = potentialIndex
        break
      }
    }
  }

  // MOCK FALLBACK
  if (!fs.existsSync(indexFile)) {
    console.warn(`[nuxt-sap-odata] SDK not found at ${indexFile}. Falling back to mock data.`)
    logRequest(200)
    
    if (entitySetName.toLowerCase() === 'exampleentities') {
      return [
        { ID: '1', Name: 'Example Item A' },
        { ID: '2', Name: 'Example Item B' },
        { ID: '3', Name: 'Example Item C' }
      ]
    }

    return {
      service: matched.name,
      entitySet: entitySetName,
      message: 'Mock data fallback (SDK missing)',
      sampleItems: [
        { id: 1, Name: 'Sample Item 1' },
        { id: 2, Name: 'Sample Item 2' }
      ]
    }
  }

  const sdk = await import(pathToFileURL(indexFile).href)
  
  // Find service factory (e.g., dummy() or DummyServiceApi())
  const serviceFactoryName = Object.keys(sdk).find(k => 
    typeof sdk[k] === 'function' && 
    (k.toLowerCase() === matched.name.toLowerCase() || k.toLowerCase() === matched.name.toLowerCase() + 'api' || k === 'dummy')
  )

  if (!serviceFactoryName) {
    logRequest(500)
    return {
      error: `Could not find service factory in SDK`,
      availableExports: Object.keys(sdk),
    }
  }

  const serviceInstance = sdk[serviceFactoryName]()
  
  // Find entity API on service instance (including prototype for getters)
  const getAllPropertyNames = (obj: any) => {
    const props = new Set<string>()
    let current = obj
    while (current && current !== Object.prototype) {
      Object.getOwnPropertyNames(current).forEach(p => props.add(p))
      current = Object.getPrototypeOf(current)
    }
    return Array.from(props)
  }

  const allProps = getAllPropertyNames(serviceInstance)
  const entityApiName = allProps.find(k => 
    k.toLowerCase() === entitySetName.toLowerCase() || 
    k.toLowerCase() === (entitySetName.toLowerCase() + 'api')
  )

  const entityApi = entityApiName ? (serviceInstance as any)[entityApiName] : null

  if (!entityApi || !entityApi.requestBuilder) {
    logRequest(404)
    return {
      error: `Entity set "${entitySetName}" not found on service "${matched.name}"`,
      availableEntities: allProps.filter(p => !['constructor', 'initApi'].includes(p) && !p.startsWith('_')),
    }
  }

  const method = event.node.req.method || 'GET'
  const query = getQuery(event)
  const destination = { url: config.odata?.destination || 'http://localhost:8080' }

  try {
    if (method === 'GET') {
      let requestBuilder = entityApi.requestBuilder().getAll()
      
      if (query.id) {
        requestBuilder = entityApi.requestBuilder().getByKey(query.id)
      } else {
        // Forward OData query parameters
        const odataParams: Record<string, string> = {}
        const keys = ['$filter', '$select', '$expand', '$top', '$skip', '$orderby']
        keys.forEach(key => {
          if (query[key]) odataParams[key] = String(query[key])
        })
        
        if (Object.keys(odataParams).length > 0) {
          requestBuilder = requestBuilder.withCustomParameters(odataParams)
        }
      }
      
      const res = await requestBuilder.execute(destination)
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
      const id = query.id as string
      if (!id) throw new Error('ID is required for PATCH')
      const res = await entityApi.requestBuilder().update(body).execute(destination)
      logRequest(200)
      return res
    }

    if (method === 'DELETE') {
      const id = query.id as string
      if (!id) throw new Error('ID is required for DELETE')
      const res = await entityApi.requestBuilder().delete(id).execute(destination)
      logRequest(204)
      return res
    }

    throw createError({ statusCode: 405, statusMessage: 'Method Not Allowed' })
  } catch (err: any) {
    // If connection fails and we are in dev, try mock fallback
    if (process.env.NODE_ENV === 'development' || config.public.odata?.mode === 'mock') {
      console.warn(`[nuxt-sap-odata] Connection to ${destination.url} failed. Using mock data for ${entitySetName}.`)
      if (entitySetName.toLowerCase() === 'exampleentities') {
        logRequest(200)
        return [
          { ID: '1', Name: 'Example Item A (Mock)' },
          { ID: '2', Name: 'Example Item B (Mock)' },
          { ID: '3', Name: 'Example Item C (Mock)' }
        ]
      }
    }

    console.error('[nuxt-sap-odata] OData Request Error:', err.message)
    const status = err.response?.status || 500
    logRequest(status)
    throw createError({
      statusCode: status,
      statusMessage: err.message || 'Internal Server Error',
      data: err.response?.data
    })
  }
})
