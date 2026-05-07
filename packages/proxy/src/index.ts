import type { ODataProxyConfig } from '@bc8-odx/core'
import { defineEventHandler } from 'h3'
import odataHandler from './api/odata'
import { resolveProxyTarget } from './utils/target'
import { parseODataRequest } from './utils/url'

export { odataGuard } from './utils/rules'
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
} from '@bc8-odx/core'
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
} from '@bc8-odx/core'

/**
 * Creates a standalone h3 event handler for OData proxying.
 * This function manually performs target resolution which is normally handled by the btp-auth plugin.
 * Used primarily for integration testing and standalone Nitro instances.
 *
 * @param config The proxy configuration.
 */
export function createODataHandler(config: ODataProxyConfig): ReturnType<typeof defineEventHandler> {
  return defineEventHandler(async (event) => {
    // 1. Inject config into context
    event.context.odataConfig = config

    const basePath = config.basePath || '/api/odx'
    if (!event.path.startsWith(basePath)) {
      return odataHandler(event)
    }

    // 2. Parse request and resolve target
    const request = parseODataRequest(event, basePath)
    if (request.serviceName) {
      event.context.proxyTarget = await resolveProxyTarget(event, config, request.serviceName)
    }

    return odataHandler(event)
  })
}
