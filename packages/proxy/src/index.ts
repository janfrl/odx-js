import type { ODataProxyConfig } from '@me-tools/odx-core'
import { defineEventHandler } from 'h3'
import odataHandler from './api/odata'
import { normalizeODataServiceRoutes } from './utils/service-route'
import { resolveProxyTarget } from './utils/target'
import { normalizeODataProxyBasePath, parseODataRequest } from './utils/url'

export type {
  ODataProxyHooks,
  ODataProxyRequestContext,
  ODataProxyResponseContext,
  OdxProxyOutcome,
  OdxProxyTargetKind,
  OdxProxyTelemetryContext,
  OdxProxyTelemetrySummary,
  SapSecurityContext,
} from './types'
export { odataGuard } from './utils/rules'
export {
  normalizeODataServiceRoute,
  normalizeODataServiceRoutes,
} from './utils/service-route'
export { normalizeODataProxyBasePath } from './utils/url'
export {
  addODataLog,
  boundLogPayload,
  clearODataLogs,
  createODataClient,
  fetchWithCsrf,
  getODataLog,
  getODataLogs,
  getOdxLogStore,
  OdxMemoryLogStore,
  redactSensitiveHeaders,
  resetOdxLogStore,
  sanitizeODataLog,
  setOdxLogStore,
  updateODataLog,
} from '@me-tools/odx-core'
export type {
  ODataLog,
  OdxBoundedPayload,
  OdxLogAppendOptions,
  OdxLogClearOptions,
  OdxLogPayloadPolicy,
  OdxLogQueryOptions,
  OdxLogStore,
  OdxLogUpdateOptions,
  ProxyTraceEntry,
} from '@me-tools/odx-core'

/**
 * Creates a standalone h3 event handler for OData proxying.
 * This function manually performs target resolution which is normally handled by the btp-auth plugin.
 * Used primarily for integration testing and standalone Nitro instances.
 *
 * @param config The proxy configuration.
 */
export function createODataHandler(config: ODataProxyConfig): ReturnType<typeof defineEventHandler> {
  const basePath = normalizeODataProxyBasePath(config.basePath || '/api/odx')
  const normalizedConfig: ODataProxyConfig = {
    ...config,
    basePath,
    services: normalizeODataServiceRoutes(config.services ?? []),
  }
  return defineEventHandler(async (event) => {
    // 1. Inject config into context
    event.context.odataConfig = normalizedConfig

    if (!event.path.startsWith(basePath)) {
      return odataHandler(event)
    }

    // 2. Parse request and resolve target
    const request = parseODataRequest(event, basePath)
    if (request.serviceName) {
      event.context.proxyTarget = await resolveProxyTarget(event, normalizedConfig, request.serviceName)
    }

    return odataHandler(event)
  })
}
