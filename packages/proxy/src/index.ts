import type { ODataProxyConfig } from '@bc8-odx/core'
import { defineEventHandler } from 'h3'
import odataHandler from './api/odata'

export { addODataLog, clearODataLogs, createODataClient, fetchWithCsrf, getODataLogs } from '@bc8-odx/core'

/**
 * Creates a standalone h3 event handler for OData proxying.
 * @param config The proxy configuration.
 */
export function createODataHandler(config: ODataProxyConfig): ReturnType<typeof defineEventHandler> {
  return defineEventHandler(async (event) => {
    // Inject config into context as expected by the handler
    event.context.odataConfig = config
    return odataHandler(event)
  })
}
