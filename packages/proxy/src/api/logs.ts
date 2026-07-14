import type { OdxLogClearOptions, OdxLogQueryOptions } from '@me-tools/odx-core'
import { clearODataLogs, getODataLogs } from '@me-tools/odx-core'
import { createError, defineEventHandler, getQuery } from 'h3'
import { enforceExplorerEndpointPolicy, isProductionExplorerRuntime } from '../utils/explorer-policy'
import { configureOdxLogStore, isPersistentOdxLogStoreConfigured } from '../utils/log-store'

const RE_POSITIVE_INTEGER = /^\d+$/
const RE_LOG_STATUS = /^(?:pending|success|failure)$/

function parseInteger(value: unknown): number | undefined {
  if (typeof value !== 'string' || !RE_POSITIVE_INTEGER.test(value))
    return undefined
  return Number.parseInt(value, 10)
}

function parseLogQuery(raw: Record<string, any>): OdxLogQueryOptions {
  const status = raw.status
  const parsedStatus = typeof status === 'string' && RE_LOG_STATUS.test(status)
    ? status as OdxLogQueryOptions['status']
    : parseInteger(status)

  return {
    limit: parseInteger(raw.limit),
    offset: parseInteger(raw.offset),
    service: typeof raw.service === 'string' ? raw.service : undefined,
    method: typeof raw.method === 'string' ? raw.method : undefined,
    status: parsedStatus,
    from: parseInteger(raw.from),
    to: parseInteger(raw.to),
    before: parseInteger(raw.before),
    after: parseInteger(raw.after),
    includePending: raw.includePending === 'false' ? false : undefined,
    order: raw.order === 'asc' ? 'asc' : raw.order === 'desc' ? 'desc' : undefined,
  }
}

function parseClearOptions(raw: Record<string, any>): OdxLogClearOptions {
  return {
    service: typeof raw.service === 'string' ? raw.service : undefined,
    before: parseInteger(raw.before),
    to: parseInteger(raw.to),
  }
}

export default defineEventHandler(async (event) => {
  enforceExplorerEndpointPolicy(event, 'logs')
  await configureOdxLogStore(event.context.odataConfig)

  if (isProductionExplorerRuntime() && !isPersistentOdxLogStoreConfigured(event.context.odataConfig)) {
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
    return await clearODataLogs(parseClearOptions(getQuery(event)))
  }

  if (event.method === 'GET' || !isProductionExplorerRuntime()) {
    return await getODataLogs(parseLogQuery(getQuery(event)))
  }

  throw createError({
    statusCode: 405,
    statusMessage: 'Method Not Allowed',
  })
})
