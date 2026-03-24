import type { ODataProxyConfig } from '@bc8-odx/core'
import fs from 'node:fs'
import https from 'node:https'
import { detectODataVersion, extractAssociationsFromEdmx, extractEntitiesFromEdmx } from '@bc8-odx/core/server'
import { createError, defineEventHandler, getQuery, setHeader } from 'h3'
import { dirname, resolve } from 'pathe'

const RE_SCHEMA_NAMESPACE = /<Schema\s+Namespace="([^"]+)"/
const RE_ENTITY_TYPE = /<EntityType Name="([^"]+)">/g
const RE_ASSOCIATION = /<Association Name="([^"]+)">/g
const RE_NAV_PROP = /<NavigationProperty Name="([^"]+)"/g
const RE_NAME_ATTR = /"([^"]+)"/

async function downloadEdmx(url: string, rejectUnauthorized: boolean): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, { rejectUnauthorized }, (res) => {
      if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
        return reject(new Error(`Failed to fetch metadata: ${res.statusCode}`))
      }
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => resolve(data))
    }).on('error', reject)
  })
}

export default defineEventHandler(async (event) => {
  const config = event.context.odataConfig as ODataProxyConfig
  const query = getQuery(event)
  const serviceName = (query.service as string) ?? ''
  const isRaw = query.raw === 'true'

  if (!serviceName) {
    throw createError({ statusCode: 400, message: 'Missing service name' })
  }

  const services = config.services ?? []
  const svc = services.find(s => s.name === serviceName)

  if (!svc) {
    throw createError({ statusCode: 404, message: `Service ${serviceName} not found` })
  }

  const buildDir = config.buildDir ?? ''
  let edmxPath = ''

  if (svc.url.startsWith('http')) {
    edmxPath = resolve(buildDir, 'odx/temp', `${svc.name}.edmx`)

    // ROBUSTNESS: If local cache is missing, try to fetch it LIVE
    if (!fs.existsSync(edmxPath)) {
      try {
        const metadataUrl = svc.url.endsWith('/') ? `${svc.url}$metadata` : `${svc.url}/$metadata`
        const xml = await downloadEdmx(metadataUrl, config.rejectUnauthorized !== false)
        
        // Ensure directory exists
        if (!fs.existsSync(dirname(edmxPath))) {
          fs.mkdirSync(dirname(edmxPath), { recursive: true })
        }
        
        fs.writeFileSync(edmxPath, xml)
      }
      catch (err: any) {
        throw createError({ 
          statusCode: 500, 
          message: `Local EDMX missing and live fetch failed for ${serviceName}: ${err.message}` 
        })
      }
    }
  }
  else {
    edmxPath = resolve(config.rootDir, svc.url)
  }

  if (!fs.existsSync(edmxPath)) {
    throw createError({ statusCode: 404, message: `EDMX file for ${serviceName} not found at ${edmxPath}` })
  }

  // Handle RAW XML request
  if (isRaw) {
    const xml = fs.readFileSync(edmxPath, 'utf-8')
    setHeader(event, 'Content-Type', 'application/xml')
    return xml
  }

  try {
    const xml = fs.readFileSync(edmxPath, 'utf-8')
    const version = detectODataVersion(edmxPath)
    const entities = extractEntitiesFromEdmx(edmxPath)
    const associations = extractAssociationsFromEdmx(edmxPath)
    const namespace = xml.match(RE_SCHEMA_NAMESPACE)?.[1] || ''

    const result = {
      name: serviceName,
      version,
      namespace,
      entities,
      associations,
      // Basic raw schema info for the graph
      raw: {
        entityTypes: xml.match(RE_ENTITY_TYPE)?.map(m => m.match(RE_NAME_ATTR)![1]) || [],
        associations: xml.match(RE_ASSOCIATION)?.map(m => m.match(RE_NAME_ATTR)![1]) || [],
        navigationProperties: xml.match(RE_NAV_PROP)?.map(m => m.match(RE_NAME_ATTR)![1]) || [],
      },
    }

    return result
  }
  catch (e: unknown) {
    const error = e as Error
    throw createError({ statusCode: 500, message: `Failed to parse EDMX: ${error.message}` })
  }
})
