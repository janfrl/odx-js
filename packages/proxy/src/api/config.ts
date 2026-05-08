import type { EntityMapping, ODataExplorerConfigResponse, ODataExplorerServiceInfo, ODataProxyConfig } from '@bc8-odx/core'
import process from 'node:process'
import { detectODataVersionFromContent, extractEntitiesFromEdmxContent } from '@bc8-odx/core/server'
import { defineEventHandler } from 'h3'
import { enforceExplorerEndpointPolicy, isProductionExplorerRuntime } from '../utils/explorer-policy'
import { readRuntimeMetadataSnapshot } from '../utils/metadata-refresh'

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
    const metadata = readRuntimeMetadataSnapshot(config, svc)
    const version = metadata.xml ? detectODataVersionFromContent(metadata.xml) : null

    if (metadata.xml)
      entities = extractEntitiesFromEdmxContent(metadata.xml)

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
