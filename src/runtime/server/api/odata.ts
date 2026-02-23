import fs from 'node:fs'
import { pathToFileURL } from 'node:url'
import { createError, defineEventHandler, getQuery, readBody, useRuntimeConfig, useStorage } from '#imports'
import { createJiti } from 'jiti'
import { join } from 'pathe'
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

  // Central log function
  const logRequest = (status: number, responseBody?: any, requestBody?: any) => {
    addODataLog({
      id: Math.random().toString(36).substring(7),
      timestamp: Date.now(),
      method: event.method || 'GET',
      url: fullPath,
      service: serviceRoute,
      entitySet: entitySetName,
      status,
      duration: Date.now() - startTime,
      requestBody,
      responseBody,
    })
  }

  const services = (config.odata?.services || []) as Array<{ name: string, route?: string, url: string }>
  const matched = services.find(
    svc => (svc.route || svc.name.toLowerCase()) === serviceRoute,
  )

  if (!matched) {
    logRequest(404)
    throw createError({ statusCode: 404, message: `Unknown service "${serviceRoute}"` })
  }

  const storage = useStorage('odata:mockdata')

  const getValidProperties = (entitySet: string): string[] | null => {
    try {
      const rootDir = config.odata?.rootDir as string
      if (!rootDir || !matched.url)
        return null

      let edmxPath = ''
      if (matched.url.startsWith('http')) {
        // Look into temp directory for downloaded metadata
        edmxPath = join(buildDir, 'sap-odata', 'temp', `${matched.name}.edmx`)
      }
      else {
        edmxPath = join(rootDir, matched.url)
      }

      if (!fs.existsSync(edmxPath))
        return null

      const content = fs.readFileSync(edmxPath, 'utf-8')
      const entitySetRegex = new RegExp(`<EntitySet\\s+Name="${entitySet}"\\s+EntityType="([^"]+)"`)
      const setMatch = entitySetRegex.exec(content)
      if (!setMatch)
        return null

      const fullEntityType = setMatch[1]
      if (!fullEntityType)
        return null

      const entityTypeName = fullEntityType.split('.').pop()
      if (!entityTypeName)
        return null

      const entityTypeRegex = new RegExp(`<EntityType\\s+Name="${entityTypeName}"[\\s\\S]*?>([\\s\\S]*?)</EntityType>`)
      const typeMatch = entityTypeRegex.exec(content)
      if (!typeMatch || !typeMatch[1])
        return null

      const propertiesBlock = typeMatch[1]
      const propRegex = /<Property\s+Name="([^"]+)"/g
      const validProps: string[] = []
      let propMatch = propRegex.exec(propertiesBlock)
      while (propMatch !== null) {
        if (propMatch[1])
          validProps.push(propMatch[1])
        propMatch = propRegex.exec(propertiesBlock)
      }
      return validProps
    }
    catch { return null }
  }

  const handleMockDataRequest = async () => {
    const method = event.method
    const query = getQuery(event)
    const mockDataKeyColon = `${matched.name}:${entitySetName}.json`
    const mockDataKeySlash = `${matched.name}/${entitySetName}.json`

    const activeKey = (await storage.hasItem(mockDataKeyColon)) ? mockDataKeyColon : mockDataKeySlash
    let data = (await storage.getItem(activeKey)) as any[] || []

    if (!Array.isArray(data)) {
      if (method === 'GET')
        return data
      throw createError({ statusCode: 400, message: 'Mockdata must be an array' })
    }

    // Property Validation
    if (method === 'POST' || method === 'PATCH' || method === 'PUT') {
      const body = await readBody(event).catch(() => null)
      if (body && typeof body === 'object') {
        const allowed = getValidProperties(entitySetName)
        if (allowed) {
          const incoming = Object.keys(body)
          const invalid = incoming.filter(p => !allowed.includes(p) && p !== 'ID' && p !== 'id')
          if (invalid.length > 0) {
            const msg = `Property validation failed. Unknown properties for ${entitySetName}: ${invalid.join(', ')}. Allowed: ${allowed.join(', ')}`
            throw createError({
              statusCode: 400,
              statusMessage: msg,
              message: msg,
            })
          }
        }
      }
    }

    if (method === 'GET') {
      const id = query.id ? String(query.id) : undefined
      if (id) {
        const item = data.find((item: any) => String(item.ID || item.id) === id)
        if (!item) {
          const msg = `Item with ID "${id}" not found in mockdata`
          throw createError({ statusCode: 404, statusMessage: msg, message: msg })
        }
        return item
      }

      // Basic Filter/Query Support for Mocks
      let result = [...data]

      // Simple $filter parsing (e.g., "Name eq 'Test'")
      const filter = query.$filter ? String(query.$filter) : null
      if (filter) {
        const match = filter.match(/(\w+)\s+eq\s+'([^']+)'/)
        if (match) {
          const [_, prop, value] = match
          if (prop) {
            result = result.filter((item: any) => String(item[prop]) === value)
          }
        }
      }

      // $orderby (e.g., "Name asc" or "Price desc")
      const orderby = query.$orderby ? String(query.$orderby) : null
      if (orderby) {
        const [prop, dir] = orderby.split(/\s+/)
        if (prop) {
          result.sort((a: any, b: any) => {
            const valA = a[prop]
            const valB = b[prop]
            if (valA === valB)
              return 0
            const multiplier = dir?.toLowerCase() === 'desc' ? -1 : 1
            return valA > valB ? multiplier : -multiplier
          })
        }
      }

      // $skip and $top
      const skip = Number.parseInt(String(query.$skip || '0'))
      const top = Number.parseInt(String(query.$top || ''))

      if (skip > 0)
        result = result.slice(skip)
      if (!Number.isNaN(top) && top > 0)
        result = result.slice(0, top)

      // $select (e.g., "Name,Price")
      const select = query.$select ? String(query.$select) : null
      if (select) {
        const props = select.split(',').map(s => s.trim())
        result = result.map((item: any) => {
          const newItem: any = {}
          props.forEach((p) => {
            if (p in item)
              newItem[p] = item[p]
          })
          // Keep ID if present even if not selected, or should we be strict?
          // Usually SAP OData is strict, but for DX we might keep ID.
          // Let's be strict but ensure ID is selectable.
          return newItem
        })
      }

      return result
    }

    if (method === 'POST') {
      const body = await readBody(event).catch(() => null)
      if (!body || typeof body !== 'object') {
        const msg = 'Invalid or missing JSON body for POST'
        throw createError({ statusCode: 400, statusMessage: msg, message: msg })
      }
      const newItem = { ...body }
      if (!newItem.ID && !newItem.id)
        newItem.ID = Math.random().toString(36).substring(7).toUpperCase()
      data.push(newItem)
      await storage.setItem(activeKey, data)
      return newItem
    }

    if (method === 'PATCH' || method === 'PUT') {
      const body = await readBody(event).catch(() => null)
      const id = (query.id ? String(query.id) : null) || (body && (body.ID || body.id))
      if (!id)
        throw createError({ statusCode: 400, statusMessage: 'Missing ID', message: 'Missing ID' })
      if (!body || typeof body !== 'object')
        throw createError({ statusCode: 400, statusMessage: 'Invalid body', message: 'Invalid body' })

      const index = data.findIndex((item: any) => String(item.ID || item.id) === String(id))
      if (index === -1) {
        const msg = `Item with ID "${id}" not found`
        throw createError({ statusCode: 404, statusMessage: msg, message: msg })
      }

      data[index] = { ...data[index], ...body }
      await storage.setItem(activeKey, data)
      return data[index]
    }

    if (method === 'DELETE') {
      const id = query.id ? String(query.id) : null
      if (!id)
        throw createError({ statusCode: 400, statusMessage: 'Missing ID', message: 'Missing ID' })
      const initialLength = data.length
      data = data.filter((item: any) => String(item.ID || item.id) !== id)
      if (data.length === initialLength) {
        const msg = `Item with ID "${id}" not found`
        throw createError({ statusCode: 404, statusMessage: msg, message: msg })
      }
      await storage.setItem(activeKey, data)
      return { success: true }
    }

    throw createError({ statusCode: 405, message: 'Method Not Allowed in Mockdata Mode' })
  }

  // --- EXECUTION FLOW ---
  let capturedBody: any = null
  try {
    if (['POST', 'PATCH', 'PUT'].includes(event.method)) {
      capturedBody = await readBody(event).catch(() => null)
    }

    let response: any
    const forceMockData = getQuery(event).mock === 'true'
    const isLocalService = !matched.url || !matched.url.startsWith('http')
    
    // Try different possible paths for the SDK index file
    const possibleDirs = [
      join(buildDir, 'sap-odata', 'generated', matched.name),
      join(buildDir, 'sap-odata', 'generated', matched.name, matched.route || matched.name.toLowerCase())
    ]
    
    let targetFile: string | null = null
    for (const dir of possibleDirs) {
      const ts = join(dir, 'index.ts')
      const js = join(dir, 'index.js')
      if (fs.existsSync(ts)) { targetFile = ts; break; }
      if (fs.existsSync(js)) { targetFile = js; break; }
    }

    // If it's a local service without a dedicated remote URL, we should prefer mock data
    // unless a global destination is set AND it's not Northwind (or we are sure)
    // For safety: Local source + No specific URL = Mock Data
    if (forceMockData || !targetFile || isLocalService) {
      if (!targetFile && !forceMockData && !isLocalService) {
        console.warn(`[nuxt-sap-odata] No SDK found for ${matched.name}, falling back to mock data. Checked:`, possibleDirs)
      }
      
      // If it's local and we have targetFile, we COULD try SDK, but without URL it will fail or hit wrong target.
      // So if it's local, we only use SDK if a specific destination is provided.
      if (isLocalService && targetFile && (config.odata?.destination || '').includes(matched.name.toLowerCase())) {
         // allow SDK if destination seems to match the service name
      } else if (isLocalService) {
         response = await handleMockDataRequest()
         const status = event.method === 'POST' ? 201 : (event.method === 'DELETE' ? 204 : 200)
         logRequest(status, response, capturedBody)
         return response
      }
    }
    else {
      try {
        const sdk = targetFile.endsWith('.ts') ? await jiti.import(targetFile) : await import(pathToFileURL(targetFile).href)
        
        // Find API factory case-insensitively
        // We check: [Name]Api, [Route]Api, [Name], [Route]
        const possibleFactoryNames = [
          `${matched.name}Api`.toLowerCase(),
          `${serviceRoute}Api`.toLowerCase(),
          matched.name.toLowerCase(),
          serviceRoute.toLowerCase()
        ]
        
        const actualFactoryKey = Object.keys(sdk).find(k => possibleFactoryNames.includes(k.toLowerCase()))
        const apiFactory = actualFactoryKey ? sdk[actualFactoryKey] : null

        if (!apiFactory) {
          const available = Object.keys(sdk).filter(k => typeof sdk[k] === 'function')
          throw new Error(`API Factory for "${matched.name}" not found. Available exports: ${available.join(', ') || 'none'}. Checked: ${possibleFactoryNames.join(', ')}`)
        }

        const api = apiFactory()
        
        // Find EntitySet case-insensitively
        // We check: [entitySet], [entitySet]Api
        const targetEntitySet = entitySetName.toLowerCase()
        const targetEntitySetApi = `${entitySetName}Api`.toLowerCase()
        
        // Find the actual key on the api object (including getters in prototype)
        let actualEntitySetKey = ''
        
        // 1. Check direct properties
        actualEntitySetKey = Object.keys(api).find(k => k.toLowerCase() === targetEntitySet || k.toLowerCase() === targetEntitySetApi) || ''
        
        // 2. Check prototype (for getters in classes)
        if (!actualEntitySetKey) {
          const proto = Object.getPrototypeOf(api)
          if (proto) {
            actualEntitySetKey = Object.getOwnPropertyNames(proto).find(k => k.toLowerCase() === targetEntitySet || k.toLowerCase() === targetEntitySetApi) || ''
          }
        }

        const entityApi = actualEntitySetKey ? api[actualEntitySetKey] : null

        if (!entityApi) {
          // Fallback for debugging: collect all possible keys from proto and instance
          const allKeys = [...Object.keys(api), ...Object.getOwnPropertyNames(Object.getPrototypeOf(api) || {})]
          const available = allKeys.filter(k => k !== 'constructor' && !k.startsWith('_'))
          throw new Error(`EntitySet "${entitySetName}" not found on service "${matched.name}". Available: ${available.join(', ')}`)
        }

        const method = event.method
        const query = getQuery(event)
        
        // Use service-specific URL if it's a remote URL, otherwise fallback to global destination
        const serviceUrl = matched.url && matched.url.startsWith('http') ? matched.url : null
        const destination = { url: serviceUrl || config.odata?.destination || 'http://localhost:8080' }

        if (method === 'GET') {
          let rb = entityApi.requestBuilder().getAll()
          if (query.id) {
            rb = entityApi.requestBuilder().getByKey(query.id)
          }
          else {
            const odataParams: Record<string, string> = {}
            const keys = ['$filter', '$select', '$expand', '$top', '$skip', '$orderby']
            keys.forEach((k) => {
              if (query[k])
                odataParams[k] = String(query[k])
            })
            if (Object.keys(odataParams).length > 0)
              rb = rb.withCustomParameters(odataParams)
          }
          response = await rb.execute(destination)
        }
        else if (method === 'POST') {
          response = await entityApi.requestBuilder().create(capturedBody).execute(destination)
        }
        else if (method === 'PATCH') {
          response = await entityApi.requestBuilder().update(capturedBody).execute(destination)
        }
        else if (method === 'DELETE') {
          response = await entityApi.requestBuilder().delete(query.id as string).execute(destination)
        }
        else {
          throw createError({ statusCode: 405, statusMessage: 'Method Not Allowed' })
        }
      }
      catch (sdkErr: any) {
        console.warn(`[nuxt-sap-odata] SDK failed, falling back to mockdata:`, sdkErr.message)
        response = await handleMockDataRequest()
      }
    }

    // Log success
    const status = event.method === 'POST' ? 201 : (event.method === 'DELETE' ? 204 : 200)
    logRequest(status, response, capturedBody)
    return response
  }
  catch (err: any) {
    // Log failure
    const statusCode = err.statusCode || 500
    logRequest(statusCode, { error: err.message || err.statusMessage }, capturedBody)
    throw err
  }
})
