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

  // Central log function
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

  const services = (config.odata?.services || []) as Array<{ name: string, route?: string, edmx: string }>
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
      if (!rootDir || !matched.edmx) return null
      
      const edmxPath = join(rootDir, matched.edmx)
      if (!fs.existsSync(edmxPath)) return null
      
      const content = fs.readFileSync(edmxPath, 'utf-8')
      const entitySetRegex = new RegExp(`<EntitySet\\s+Name="${entitySet}"\\s+EntityType="([^"]+)"`)
      const setMatch = entitySetRegex.exec(content)
      if (!setMatch) return null
      
      const fullEntityType = setMatch[1]
      if (!fullEntityType) return null
      
      const entityTypeName = fullEntityType.split('.').pop()
      if (!entityTypeName) return null

      const entityTypeRegex = new RegExp(`<EntityType\\s+Name="${entityTypeName}"[\\s\\S]*?>([\\s\\S]*?)</EntityType>`)
      const typeMatch = entityTypeRegex.exec(content)
      if (!typeMatch || !typeMatch[1]) return null
      
      const propertiesBlock = typeMatch[1]
      const propRegex = /<Property\s+Name="([^"]+)"/g
      const validProps: string[] = []
      let propMatch
      while ((propMatch = propRegex.exec(propertiesBlock)) !== null) {
        if (propMatch[1]) validProps.push(propMatch[1])
      }
      return validProps
    } catch { return null }
  }

  const handleMockDataRequest = async () => {
    const method = event.method
    const query = getQuery(event)
    const mockDataKeyColon = `${matched.name}:${entitySetName}.json`
    const mockDataKeySlash = `${matched.name}/${entitySetName}.json`
    
    const activeKey = (await storage.hasItem(mockDataKeyColon)) ? mockDataKeyColon : mockDataKeySlash
    let data = (await storage.getItem(activeKey)) as any[] || []

    if (!Array.isArray(data)) {
      if (method === 'GET') return data
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
              message: msg 
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
      return data
    }

    if (method === 'POST') {
      const body = await readBody(event).catch(() => null)
      if (!body || typeof body !== 'object') {
        const msg = 'Invalid or missing JSON body for POST'
        throw createError({ statusCode: 400, statusMessage: msg, message: msg })
      }
      const newItem = { ...body }
      if (!newItem.ID && !newItem.id) newItem.ID = Math.random().toString(36).substring(7).toUpperCase()
      data.push(newItem)
      await storage.setItem(activeKey, data)
      return newItem
    }

    if (method === 'PATCH' || method === 'PUT') {
      const body = await readBody(event).catch(() => null)
      const id = (query.id ? String(query.id) : null) || (body && (body.ID || body.id))
      if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing ID', message: 'Missing ID' })
      if (!body || typeof body !== 'object') throw createError({ statusCode: 400, statusMessage: 'Invalid body', message: 'Invalid body' })

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
      if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing ID', message: 'Missing ID' })
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
  try {
    let response: any
    const forceMockData = getQuery(event).mock === 'true'
    const subDirName = matched.route || matched.name.toLowerCase()
    const generatedDir = join(buildDir, 'sap-odata', 'generated', matched.name, subDirName)
    const indexFileTs = join(generatedDir, 'index.ts')
    const indexFileJs = join(generatedDir, 'index.js')
    const targetFile = fs.existsSync(indexFileTs) ? indexFileTs : (fs.existsSync(indexFileJs) ? indexFileJs : null)

    if (forceMockData || !targetFile) {
      response = await handleMockDataRequest()
    } else {
      try {
        const sdk = targetFile.endsWith('.ts') ? await jiti.import(targetFile) : await import(pathToFileURL(targetFile).href)
        const apiFactory = sdk[`${matched.name}Api`]
        if (!apiFactory) throw new Error('API Factory not found')
        const api = apiFactory()
        const entityApi = api[entitySetName] || api[entitySetName.charAt(0).toLowerCase() + entitySetName.slice(1)]
        if (!entityApi) throw new Error(`EntitySet ${entitySetName} not found`)

        const method = event.method
        const query = getQuery(event)
        const destination = { url: config.odata?.destination || 'http://localhost:8080' }

        if (method === 'GET') {
          let rb = entityApi.requestBuilder().getAll()
          if (query.id) rb = entityApi.requestBuilder().getByKey(query.id)
          else {
            const odataParams: Record<string, string> = {}
            const keys = ['$filter', '$select', '$expand', '$top', '$skip', '$orderby']
            keys.forEach(k => { if (query[k]) odataParams[k] = String(query[k]) })
            if (Object.keys(odataParams).length > 0) rb = rb.withCustomParameters(odataParams)
          }
          response = await rb.execute(destination)
        } else if (method === 'POST') {
          const body = await readBody(event)
          response = await entityApi.requestBuilder().create(body).execute(destination)
        } else if (method === 'PATCH') {
          const body = await readBody(event)
          response = await entityApi.requestBuilder().update(body).execute(destination)
        } else if (method === 'DELETE') {
          response = await entityApi.requestBuilder().delete(query.id as string).execute(destination)
        } else {
          throw createError({ statusCode: 405, statusMessage: 'Method Not Allowed' })
        }
      } catch (sdkErr: any) {
        console.warn(`[nuxt-sap-odata] SDK failed, falling back to mockdata:`, sdkErr.message)
        response = await handleMockDataRequest()
      }
    }

    // Log success
    const status = event.method === 'POST' ? 201 : (event.method === 'DELETE' ? 204 : 200)
    logRequest(status)
    return response

  } catch (err: any) {
    // Log failure
    const statusCode = err.statusCode || 500
    logRequest(statusCode)
    throw err
  }
})
