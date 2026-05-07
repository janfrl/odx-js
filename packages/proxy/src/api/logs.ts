import { clearODataLogs, getODataLogs } from '@bc8-odx/core'
import { createError, defineEventHandler } from 'h3'
import { enforceExplorerEndpointPolicy, isProductionExplorerRuntime } from '../utils/explorer-policy'

export default defineEventHandler((event) => {
  enforceExplorerEndpointPolicy(event, 'logs')

  if (isProductionExplorerRuntime()) {
    if (event.method === 'GET') {
      return []
    }

    if (event.method === 'DELETE') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden: production Explorer traffic logs cannot be cleared before persistent log policy is configured',
      })
    }

    throw createError({
      statusCode: 405,
      statusMessage: 'Method Not Allowed',
    })
  }

  if (event.method === 'DELETE') {
    return clearODataLogs()
  }
  return getODataLogs()
})
