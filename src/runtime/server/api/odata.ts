import { defineEventHandler, getQuery, useRuntimeConfig, createError, readBody } from '#imports'
import { join } from 'pathe'
import fs from 'node:fs'
import { pathToFileURL } from 'node:url'

export default defineEventHandler(async (event) => {
  console.log('[nuxt-sap-odata] Handler called for URL:', event.node.req.url)
  const config = useRuntimeConfig()
  const basePath = config.public?.odata?.basePath || '/api/sap-odata'
  const buildDir = config.odata?.buildDir as string

  const url = event.node.req.url || ''
  const [path] = url.split('?')
  
  // Extract service and entity set from path
  // Expected: /api/sap-odata/dummy/Products/...
  const relativePath = path.startsWith(basePath + '/') 
    ? path.slice((basePath + '/').length) 
    : ''
  
  const segments = relativePath.split('/').filter(Boolean)
  const serviceRoute = segments[0] || ''
  const entitySetName = segments[1] || ''

  const services = (config.odata?.services || []) as Array<{ name: string; route?: string }>
  const matched = services.find(
    (svc) => (svc.route || svc.name.toLowerCase()) === serviceRoute
  )

  if (!matched) {
    throw createError({
      statusCode: 404,
      statusMessage: `Unknown service "${serviceRoute}"`,
    })
  }

  // The generator creates a directory structure: [outputDir]/[serviceName]
  // In module.ts we use: join(nuxt.options.buildDir, 'sap-odata', 'generated', svc.name)
  const generatedDir = join(
    buildDir,
    'sap-odata',
    'generated',
    matched.name
  )
  
  // The SDK usually has an index.js in the root of the generated service
  const indexFile = join(generatedDir, 'index.js')

  if (!fs.existsSync(indexFile)) {
    console.warn(`[nuxt-sap-odata] SDK not found at ${indexFile}. Falling back to mock data.`)
    
    // Return mock data based on entity set
    if (entitySetName.toLowerCase() === 'products') {
      return [
        { id: '1', Name: 'Mock Product A', Price: 100, Currency: 'EUR' },
        { id: '2', Name: 'Mock Product B', Price: 250, Currency: 'EUR' },
        { id: '3', Name: 'Mock Product C', Price: 45, Currency: 'USD' }
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
  
  // SAP Cloud SDK structure: 
  // - It exports a function `[ServiceName]Api`
  // - That function returns an object with a `requestBuilder()` method
  const apiFactoryName = `${matched.name}Api`
  if (!sdk[apiFactoryName]) {
    return {
      error: `API Factory "${apiFactoryName}" not found in generated SDK`,
      availableExports: Object.keys(sdk),
    }
  }

  const api = sdk[apiFactoryName]()
  
  // Try to find the entity set on the API
  // In SDK v3, it's often directly a property on the api object
  const entityApi = api[entitySetName] || api[entitySetName.charAt(0).toLowerCase() + entitySetName.slice(1)]
  
  if (!entityApi) {
    return {
      error: `Entity set "${entitySetName}" not found on service "${matched.name}"`,
      availableEntities: Object.keys(api).filter(k => typeof api[k] === 'object'),
    }
  }

  const method = event.node.req.method || 'GET'
  const query = getQuery(event)
  const destination = { url: config.odata?.destination || 'http://localhost:8080' }

  try {
    if (method === 'GET') {
      let requestBuilder = entityApi.requestBuilder().getAll()
      
      // Basic query mapping (very simplified)
      if (query.id) {
        requestBuilder = entityApi.requestBuilder().getByKey(query.id)
      }

      return await requestBuilder.execute(destination)
    }

    if (method === 'POST') {
      const body = await readBody(event)
      return await entityApi.requestBuilder().create(body).execute(destination)
    }

    if (method === 'PATCH') {
      const body = await readBody(event)
      const id = query.id as string
      if (!id) throw new Error('ID is required for PATCH')
      // This is a simplification; SDK PATCH usually needs the full entity or key
      return await entityApi.requestBuilder().update(body).execute(destination)
    }

    if (method === 'DELETE') {
      const id = query.id as string
      if (!id) throw new Error('ID is required for DELETE')
      return await entityApi.requestBuilder().delete(id).execute(destination)
    }

    throw createError({ statusCode: 405, statusMessage: 'Method Not Allowed' })
  } catch (err: any) {
    console.error('[nuxt-sap-odata] OData Request Error:', err.message)
    throw createError({
      statusCode: err.response?.status || 500,
      statusMessage: err.message || 'Internal Server Error',
      data: err.response?.data
    })
  }
})
