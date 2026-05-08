import type { ODataProxyConfig } from '@bc8-odx/core'
import { detectODataVersionFromContent, extractAssociationsFromEdmxContent, extractEntitiesFromEdmxContent } from '@bc8-odx/core/server'
import { createError, defineEventHandler, getQuery, setHeader } from 'h3'
import { enforceExplorerEndpointPolicy, isProductionExplorerRuntime } from '../utils/explorer-policy'
import { readRuntimeMetadataSnapshot } from '../utils/metadata-refresh'

const RE_SCHEMA_NAMESPACE = /<Schema\s+Namespace="([^"]+)"/
const RE_ENTITY_TYPE = /<EntityType Name="([^"]+)">/g
const RE_ASSOCIATION = /<Association Name="([^"]+)">/g
const RE_NAV_PROP = /<NavigationProperty Name="([^"]+)"/g
const RE_NAME_ATTR = /"([^"]+)"/

export default defineEventHandler((event) => {
  enforceExplorerEndpointPolicy(event, 'schema')

  const config = event.context.odataConfig as ODataProxyConfig
  const query = getQuery(event)
  const serviceName = (query.service as string) ?? ''
  const isRaw = query.raw === 'true'
  const isProduction = isProductionExplorerRuntime()

  if (!serviceName) {
    throw createError({ statusCode: 400, message: 'Missing service name' })
  }

  const services = config.services ?? []
  const svc = services.find(s => s.name === serviceName)

  if (!svc) {
    throw createError({ statusCode: 404, message: `Service ${serviceName} not found` })
  }

  if (isProduction && isRaw) {
    throw createError({
      statusCode: 403,
      message: 'Raw production metadata XML is not exposed by Explorer runtime endpoints',
    })
  }

  const metadata = readRuntimeMetadataSnapshot(config, svc)

  if (!metadata.exists || !metadata.xml) {
    throw createError({
      statusCode: 404,
      message: metadata.missingReason || `Cached EDMX metadata for ${serviceName} not found`,
      data: {
        service: serviceName,
        metadata: {
          status: 'missing',
          source: metadata.source,
          stale: false,
          staleReason: null,
          refreshedAt: null,
          timestamp: null,
          hash: null,
          bytes: null,
        },
      },
    })
  }

  // Handle RAW XML request
  if (isRaw) {
    setHeader(event, 'Content-Type', 'application/xml')
    return metadata.xml
  }

  try {
    const xml = metadata.xml
    const version = detectODataVersionFromContent(xml)
    const entities = extractEntitiesFromEdmxContent(xml)
    const associations = extractAssociationsFromEdmxContent(xml)
    const namespace = xml.match(RE_SCHEMA_NAMESPACE)?.[1] || ''

    const result = {
      name: serviceName,
      version,
      namespace,
      entities,
      associations,
      metadata: {
        status: metadata.stale ? 'stale' : 'available',
        source: metadata.source,
        stale: metadata.stale,
        staleReason: metadata.staleReason,
        refreshedAt: metadata.refreshedAt,
        timestamp: metadata.timestamp,
        hash: metadata.hash,
        bytes: metadata.bytes,
      },
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
