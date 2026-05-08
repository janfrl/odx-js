import type { H3Event } from 'h3'
import process from 'node:process'
import { createError } from 'h3'

export type ExplorerEndpoint = 'config' | 'logs' | 'generate' | 'schema' | 'types' | 'me'

const PRODUCTION_DEVELOPMENT_ONLY_ENDPOINTS = new Set<ExplorerEndpoint>(['types'])

export function isProductionExplorerRuntime(): boolean {
  return process.env.NODE_ENV === 'production'
}

export function enforceExplorerEndpointPolicy(event: H3Event, endpoint: ExplorerEndpoint): void {
  if (!isProductionExplorerRuntime()) {
    return
  }

  if (!event.context.securityContext) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized: Explorer runtime endpoints require authenticated SAP security context in production',
    })
  }

  if (PRODUCTION_DEVELOPMENT_ONLY_ENDPOINTS.has(endpoint)) {
    throw createError({
      statusCode: 403,
      statusMessage: `Forbidden: /__odx__/${endpoint} is development-only in production`,
    })
  }
}
