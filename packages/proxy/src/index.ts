import type { ODataProxyConfig } from '@bc8-odx/core'
import { defineEventHandler } from 'h3'
import odataHandler from './api/odata'

export * from './utils/csrf'
export * from './utils/dev-logs'
export * from './utils/odata-client'

/**
 * Creates a standalone h3 event handler for OData proxying.
 * @param config The proxy configuration.
 */
export function createODataHandler(config: ODataProxyConfig) {
  return defineEventHandler(async (event) => {
    // Inject config into context as expected by the handler
    event.context.odataConfig = config
    return odataHandler(event)
  })
}
