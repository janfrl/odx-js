import type { EntityMapping, ODataExplorerConfigResponse, ODataExplorerServiceInfo, ODataProxyConfig } from '@me-tools/odx-core'
import process from 'node:process'
import { defineEventHandler } from 'h3'
import { enforceExplorerEndpointPolicy, isProductionExplorerRuntime } from '../utils/explorer-policy'
import { readRuntimeMetadataSnapshot } from '../utils/metadata-refresh'
import { tryParseMetadataSchema } from '../utils/metadata-schema'

function sanitizeServiceForProduction(service: any): ODataExplorerServiceInfo {
  return {
    name: service.name,
    route: service.route,
    icon: service.icon,
    strategy: service.strategy,
    proxyMode: service.proxyMode,
    entities: service.entities,
    isGenerated: service.isGenerated,
    version: service.version,
    metadata: service.metadata,
  }
}

export default defineEventHandler((event) => {
  enforceExplorerEndpointPolicy(event, 'config')

  const config = event.context.odataConfig as ODataProxyConfig
  const services = config.services ?? []

  const enhancedServices = services.map((svc) => {
    let entities: EntityMapping[] = []
    let version: 'v2' | 'v4' | null = null
    const metadata = readRuntimeMetadataSnapshot(config, svc, { sanitizeFailureReasons: isProductionExplorerRuntime() })

    if (metadata.xml) {
      const projection = tryParseMetadataSchema(metadata.xml)
      entities = projection?.entities ?? []
      version = projection?.version ?? null
    }

    return {
      ...svc,
      entities,
      isGenerated: false,
      version,
      metadata: {
        status: metadata.exists ? (metadata.stale ? 'stale' : 'available') : 'missing',
        source: metadata.source,
        stale: metadata.stale,
        staleReason: metadata.staleReason,
        refreshedAt: metadata.refreshedAt,
        timestamp: metadata.timestamp,
        hash: metadata.hash,
        bytes: metadata.bytes,
        message: metadata.missingReason ?? undefined,
      },
    }
  })

  if (isProductionExplorerRuntime()) {
    return {
      basePath: config.basePath || '/api/odx',
      mode: config.mode || 'sdk',
      services: enhancedServices.map(sanitizeServiceForProduction),
    } satisfies ODataExplorerConfigResponse
  }

  return {
    basePath: config.basePath || '/api/odx',
    mode: config.mode || 'sdk',
    services: enhancedServices,
    forwardAuthHeader: config.forwardAuthHeader,
    versions: {
      node: process.version,
      module: '1.0.0',
    },
  }
})
