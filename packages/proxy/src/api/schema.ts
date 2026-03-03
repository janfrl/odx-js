import type { ODataProxyConfig } from '@bc8-odx/core'
import fs from 'node:fs'
import { createError, defineEventHandler, getQuery } from 'h3'
import { resolve } from 'pathe'
import { detectODataVersion, extractAssociationsFromEdmx, extractEntitiesFromEdmx } from '@bc8-odx/core/server'

export default defineEventHandler((event) => {
  const config = event.context.odataConfig as ODataProxyConfig
  const query = getQuery(event)
  const serviceName = (query.service as string) ?? ''

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
  }
  else {
    edmxPath = resolve(config.rootDir, svc.url)
  }

  if (!fs.existsSync(edmxPath)) {
    throw createError({ statusCode: 404, message: `EDMX file for ${serviceName} not found at ${edmxPath}` })
  }

  try {
    const xml = fs.readFileSync(edmxPath, 'utf-8')
    const version = detectODataVersion(edmxPath)
    const entities = extractEntitiesFromEdmx(edmxPath)
    const associations = extractAssociationsFromEdmx(edmxPath)
    const namespace = xml.match(/<Schema\s+Namespace="([^"]+)"/)?.[1] || ''

    const result = {
      name: serviceName,
      version,
      namespace,
      entities,
      associations,
      // Basic raw schema info for the graph
      raw: {
        entityTypes: xml.match(/<EntityType Name="([^"]+)">/g)?.map(m => m.match(/"([^"]+)"/)![1]) || [],
        associations: xml.match(/<Association Name="([^"]+)">/g)?.map(m => m.match(/"([^"]+)"/)![1]) || [],
        navigationProperties: xml.match(/<NavigationProperty Name="([^"]+)"/g)?.map(m => m.match(/"([^"]+)"/)![1]) || [],
      },
    }

    return result
  }
  catch (e: unknown) {
    const error = e as Error
    throw createError({ statusCode: 500, message: `Failed to parse EDMX: ${error.message}` })
  }
})
