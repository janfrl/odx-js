import type { ODataProxyConfig } from '@me-tools/odx-core'
import { createError, defineEventHandler, getQuery } from 'h3'
import { join } from 'pathe'
import { enforceExplorerEndpointPolicy, isProductionExplorerRuntime } from '../utils/explorer-policy'
import { refreshRuntimeMetadata, sanitizeMetadataFailureReason } from '../utils/metadata-refresh'

export default defineEventHandler(async (event) => {
  enforceExplorerEndpointPolicy(event, 'generate')

  const config = event.context.odataConfig as ODataProxyConfig
  const query = getQuery(event)
  const serviceName = (query.service as string) ?? ''

  if (!serviceName) {
    throw createError({ statusCode: 400, statusMessage: 'Missing service name' })
  }

  const services = config.services ?? []
  const matched = services.find(s => s.name === serviceName)

  if (!matched) {
    throw createError({ statusCode: 404, statusMessage: `Service ${serviceName} not found` })
  }

  const buildDir = config.buildDir ?? ''
  const outRoot = join(buildDir, 'odx', 'generated')
  const outDir = join(outRoot, matched.name)

  try {
    const metadata = await refreshRuntimeMetadata(event, config, matched)

    if (isProductionExplorerRuntime()) {
      return {
        success: true,
        operation: 'metadata-refresh',
        generated: false,
        stale: metadata.stale,
        staleReason: metadata.staleReason,
        message: metadata.stale
          ? `Refreshed ${matched.name} runtime metadata from cached metadata (${metadata.staleReason})`
          : `Refreshed ${matched.name} runtime metadata`,
        service: matched.name,
        timestamp: metadata.timestamp,
        refreshedAt: metadata.refreshedAt,
        hash: metadata.hash,
        bytes: metadata.bytes,
        source: metadata.source,
      }
    }

    const generate = event.context.odataGenerator
    if (typeof generate !== 'function') {
      throw createError({ statusCode: 501, statusMessage: 'SDK Generation not supported by host' })
    }

    await generate(metadata.inputPath, outDir, matched.name)

    return {
      success: true,
      operation: 'sdk-generation',
      generated: true,
      stale: metadata.stale,
      staleReason: metadata.staleReason,
      message: metadata.stale
        ? `Generated ${matched.name} from cached metadata (SAP unreachable: ${metadata.staleReason})`
        : `Generated ${matched.name} successfully`,
      service: matched.name,
      timestamp: metadata.timestamp,
      refreshedAt: metadata.refreshedAt,
      hash: metadata.hash,
      bytes: metadata.bytes,
      source: metadata.source,
    }
  }
  catch (err: unknown) {
    const error = err as any
    if (error.statusCode) {
      throw error
    }

    const message = error.message || String(error)
    const isProduction = isProductionExplorerRuntime()
    const publicMessage = isProduction ? sanitizeMetadataFailureReason(error) : message
    const failureLabel = isProduction ? 'Metadata refresh failed' : 'Generation failed'
    console.error(`[ODX] Generation failed for ${serviceName}:`, message)

    throw createError({
      statusCode: 500,
      statusMessage: `${failureLabel}: ${publicMessage}`,
      data: { error: publicMessage },
    })
  }
})
