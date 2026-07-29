import type { ODataProxyConfig } from '@me-tools/odx-core'
import { createError, defineEventHandler, getQuery, setHeader } from 'h3'
import { enforceExplorerEndpointPolicy, isProductionExplorerRuntime } from '../utils/explorer-policy'
import { readRuntimeMetadataSnapshot } from '../utils/metadata-refresh'
import { parseMetadataSchema } from '../utils/metadata-schema'

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

  const metadata = readRuntimeMetadataSnapshot(config, svc, { sanitizeFailureReasons: isProduction })

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
    const { associations, entities, namespace, raw, version } = parseMetadataSchema(xml)

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
      raw,
    }

    return result
  }
  catch (e: unknown) {
    const error = e as Error
    throw createError({ statusCode: 500, message: `Failed to parse EDMX: ${error.message}` })
  }
})
