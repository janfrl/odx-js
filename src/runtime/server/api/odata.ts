import fs from 'node:fs'
import { pathToFileURL } from 'node:url'
import { createError, defineEventHandler, getQuery, readBody, useRuntimeConfig, useStorage } from '#imports'
import { XMLParser } from 'fast-xml-parser'
import { createJiti } from 'jiti'
import { join } from 'pathe'
import { addODataLog } from '../utils/dev-logs'

/**
 * Extracts ReferentialConstraint for a specific navigation property.
 */
async function getNavigationMetadata(serviceName: string, entitySetName: string, navPropName: string, config: any, buildDir: string) {
  try {
    const services = (config.odata?.services || []) as any[]
    const svc = services.find(s => s.name === serviceName)
    if (!svc)
      return null

    const rootDir = config.odata?.rootDir as string
    const edmxPath = svc.url.startsWith('http')
      ? join(buildDir, 'sap-odata', 'temp', `${svc.name}.edmx`)
      : join(rootDir, svc.url)

    if (!fs.existsSync(edmxPath))
      return null

    const xml = fs.readFileSync(edmxPath, 'utf-8')
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' })
    const jsonObj = parser.parse(xml)

    const edmx = jsonObj['edmx:Edmx'] || jsonObj.Edmx
    const schema = Array.isArray(edmx?.['edmx:DataServices']?.Schema)
      ? edmx['edmx:DataServices'].Schema[0]
      : edmx?.['edmx:DataServices']?.Schema

    if (!schema)
      return null

    // 1. Find the EntityType for this EntitySet
    const entityContainers = Array.isArray(schema.EntityContainer) ? schema.EntityContainer : [schema.EntityContainer]
    const container = entityContainers[0]
    const entitySet = (Array.isArray(container?.EntitySet) ? container.EntitySet : [container?.EntitySet])
      .find((es: any) => es.Name === entitySetName)

    if (!entitySet)
      return null
    const fullEntityType = entitySet.EntityType
    const entityTypeName = fullEntityType.split('.').pop()

    // 2. Find the NavigationProperty in the EntityType
    const entityType = (Array.isArray(schema.EntityType) ? schema.EntityType : [schema.EntityType])
      .find((et: any) => et.Name === entityTypeName)

    if (!entityType)
      return null
    const navProp = (Array.isArray(entityType.NavigationProperty) ? entityType.NavigationProperty : [entityType.NavigationProperty])
      .find((np: any) => np.Name === navPropName)

    if (!navProp)
      return null
    const relationshipName = navProp.Relationship.split('.').pop()

    // 3. Find the Association and its ReferentialConstraint
    const association = (Array.isArray(schema.Association) ? schema.Association : [schema.Association])
      .find((assoc: any) => assoc.Name === relationshipName)

    if (!association || !association.ReferentialConstraint)
      return null

    const constraint = association.ReferentialConstraint
    return {
      dependentProperty: constraint.Dependent?.PropertyRef?.Name || constraint.Dependent?.PropertyRef?.name,
      principalProperty: constraint.Principal?.PropertyRef?.Name || constraint.Principal?.PropertyRef?.name,
      principalRole: constraint.Principal?.Role || constraint.Principal?.role,
      dependentRole: constraint.Dependent?.Role || constraint.Dependent?.role,
    }
  }
  catch (e) {
    console.error('[nuxt-sap-odata] Failed to parse navigation metadata:', e)
    return null
  }
}

/**
 * Recursively flattens OData V2 'results' structures and removes metadata.
 */
function flattenOData(data: any): any {
  if (!data || typeof data !== 'object')
    return data

  // 1. Handle OData V2 results wrapper
  if (data.results && Array.isArray(data.results)) {
    return flattenOData(data.results)
  }

  // 2. Handle Arrays
  if (Array.isArray(data)) {
    return data.map(item => flattenOData(item))
  }

  // 3. Handle Objects (Flatten properties)
  const flattened: any = {}
  let hasActualData = false

  for (const key in data) {
    if (key === '__metadata' || key === '__deferred')
      continue

    const value = flattenOData(data[key])

    // We keep the key even if the value is null (e.g. for non-expanded nav props)
    // This allows the UI to detect that the property exists.
    flattened[key] = value

    // Primitive values or non-null objects count as "actual data"
    if (value !== null && value !== undefined) {
      hasActualData = true
    }
  }

  // Return the object if it has any properties (even if all are null)
  return Object.keys(flattened).length > 0 ? flattened : null
}

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
  let entitySetName = segments[1] || ''
  let resourceId = ''

  // Support for Entity(Key) syntax
  if (entitySetName.includes('(')) {
    const match = entitySetName.match(/^([^(]+)\(([^)]+)\)$/)
    if (match) {
      entitySetName = match[1]!
      resourceId = match[2]!.replace(/^'|'$/g, '') // Remove quotes if present
    }
  }

  // Central log function
  const logRequest = (status: number, responseBody?: any, requestBody?: any, targetUrl?: string) => {
    addODataLog({
      id: Math.random().toString(36).substring(7),
      timestamp: Date.now(),
      method: event.method || 'GET',
      url: fullPath,
      targetUrl, // New: The real OData backend URL
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
      const id = resourceId || (query.id ? String(query.id) : undefined)
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

      // Apply Smart Filters from query
      for (const k in query) {
        if (!k.startsWith('$') && k !== 'mock') {
          const val = String(query[k])
          result = result.filter((item: any) => String(item[k]) === val)
        }
      }

      // Standard OData Filter parsing (very basic)
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

      // --- EXPAND SUPPORT FOR MOCKS ---
      const expand = query.$expand ? String(query.$expand).split(',').map(s => s.trim()) : []
      if (expand.length > 0) {
        for (const navProp of expand) {
          const meta = await getNavigationMetadata(matched.name, entitySetName, navProp, config, buildDir)

          const pluralName = navProp.endsWith('y') ? `${navProp.slice(0, -1)}ies` : `${navProp}s`
          const possibleKeys = [`${matched.name}:${navProp}.json`, `${matched.name}:${pluralName}.json`]

          let relatedData: any[] | null = null
          for (const rKey of possibleKeys) {
            if (await storage.hasItem(rKey)) {
              relatedData = (await storage.getItem(rKey)) as any[]
              break
            }
          }

          if (Array.isArray(relatedData) && meta) {
            for (const entity of result) {
              // Decide if it's a forward or inverse lookup based on meta
              // If the current entity is 'Dependent', it's a forward lookup (n:1)
              // If the current entity is 'Principal', it's an inverse lookup (1:n)

              if (entity[meta.dependentProperty] !== undefined) {
                // Forward Lookup (e.g. Product -> Supplier)
                const fkValue = entity[meta.dependentProperty]
                entity[navProp] = relatedData.find(item => String(item[meta.principalProperty]) === String(fkValue)) || null
              }
              else {
                // Inverse Lookup (e.g. Category -> Products)
                const pkValue = entity[meta.principalProperty]
                const children = relatedData.filter(item => String(item[meta.dependentProperty]) === String(pkValue))
                if (children.length > 0) {
                  entity[navProp] = children
                }
              }
            }
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
      join(buildDir, 'sap-odata', 'generated', matched.name, matched.route || matched.name.toLowerCase()),
    ]

    let targetFile: string | null = null
    for (const dir of possibleDirs) {
      const ts = join(dir, 'index.ts')
      const js = join(dir, 'index.js')
      if (fs.existsSync(ts)) { targetFile = ts; break }
      if (fs.existsSync(js)) { targetFile = js; break }
    }

    // If it's a local service without a dedicated remote URL, we should prefer mock data
    // unless a global destination is set AND it's not Northwind (or we are sure)
    // For safety: Local source + No specific URL = Mock Data
    if (forceMockData || !targetFile || isLocalService) {
      if (!targetFile && !forceMockData && !isLocalService) {
        console.warn(`[nuxt-sap-odata] No SDK found for ${matched.name}, falling back to mock data. Checked:`, possibleDirs)
      }

      // 1. If we have a target file and a specific destination, we can try the SDK even for local-sourced services
      if (isLocalService && targetFile && (config.odata?.destination || '').includes(matched.name.toLowerCase())) {
        // allow SDK execution below
      }
      // 2. Otherwise, if the SDK is missing OR we are forced to mock OR it's a local service, use mock data
      else {
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
          serviceRoute.toLowerCase(),
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
        // Normalize URL by removing trailing slash to prevent double-slashes in the request path
        const serviceUrl = matched.url && matched.url.startsWith('http') ? matched.url.replace(/\/$/, '') : null
        const globalDest = (config.odata?.destination || 'http://localhost:8080').replace(/\/$/, '')
        const destination = { url: serviceUrl || globalDest }

        if (method === 'GET') {
          if (resourceId) {
            // Standard OData GetByKey
            const rawResponse = await entityApi.requestBuilder().getByKey(resourceId).executeRaw(destination)
            let res = rawResponse.data
            // Unwrap single entity (V2 puts it in 'd')
            if (res && res.d)
              res = res.d

            logRequest(200, res, capturedBody)
            return flattenOData(res)
          }

          let rb = entityApi.requestBuilder().getAll()

          const customParams: Record<string, string> = {}

          // 1. Collect all OData parameters starting with $
          // We pass them as custom parameters to be as generic as possible
          for (const k in query) {
            if (k.startsWith('$')) {
              customParams[k] = String(query[k])
            }
          }

          // 2. Build smart filters for non-$ parameters
          const smartFilters: string[] = []
          for (const k in query) {
            if (!k.startsWith('$') && k !== 'mock' && k !== 'id') {
              const val = query[k]
              if (val !== undefined && val !== null) {
                // Helper to find the real OData field name from the SDK schema
                const schema = entityApi.schema || {}
                const schemaKey = Object.keys(schema).find(key => key.toLowerCase() === k.toLowerCase())
                const realKey = (schemaKey && schema[schemaKey]._fieldName) ? schema[schemaKey]._fieldName : k

                const formattedVal = (typeof val === 'string' && isNaN(Number(val))) ? `'${val}'` : val
                smartFilters.push(`${realKey} eq ${formattedVal}`)
              }
            }
          }

          if (smartFilters.length > 0) {
            const smartStr = smartFilters.join(' and ')
            customParams.$filter = customParams.$filter
              ? `(${customParams.$filter}) and (${smartStr})`
              : smartStr
          }

          // 3. Apply all collected parameters to the Request Builder
          if (Object.keys(customParams).length > 0) {
            // Encode filters to prevent "unescaped characters" errors
            if (customParams.$filter) {
              customParams.$filter = encodeURI(customParams.$filter)
            }
            rb = rb.addCustomQueryParameters(customParams)
          }

          // Pre-calculate URL for logging purposes

          // Pre-calculate URL for logging purposes
          const finalUrl = await rb.url(destination).catch(() => 'unknown')

          // Use executeRaw() to get the un-deserialized JSON from the backend.
          // This preserves the original PascalCase casing of the property names.
          const rawResponse = await rb.executeRaw(destination)

          // Unwrap OData results (V2: data.d.results or data.d, V4: data.value)
          let res = rawResponse.data
          if (res && typeof res === 'object') {
            if ('d' in res) {
              res = res.d.results || res.d
            }
            else if ('value' in res) {
              res = res.value
            }
          }

          logRequest(200, res, capturedBody, finalUrl)

          // Return flattened data to the client, but log remains original
          return flattenOData(res)
        }
        else if (method === 'POST') {
          response = await entityApi.requestBuilder().create(capturedBody).execute(destination)
        }
        else if (method === 'PATCH' || method === 'PUT') {
          if (!resourceId)
            throw new Error('ID is required in the URL (e.g. Entity(ID)) for updates')
          // Note: This is a simplified update. Usually one might fetch first or use a partial entity.
          // For now, we assume the capturedBody contains the fields to update.
          const res = await entityApi.requestBuilder().update(capturedBody).execute(destination)
          logRequest(200, res, capturedBody)
          return res
        }
        else if (method === 'DELETE') {
          const id = resourceId || (query.id as string)
          if (!id)
            throw new Error('ID is required for DELETE (either in URL or ?id= parameter)')
          const res = await entityApi.requestBuilder().delete(id).execute(destination)
          logRequest(204, null, capturedBody)
          return res
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
    // Try to extract URL from the error or the event if possible
    const targetUrl = err.config?.url || err.request?.url
    logRequest(statusCode, { error: err.message || err.statusMessage }, capturedBody, targetUrl)
    throw err
  }
})
