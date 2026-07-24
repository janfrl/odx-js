import type { RequestLogger } from 'evlog'
import type { H3Event } from 'h3'
import { createRequestLogger, initLogger } from 'evlog'
import { createMemoryDrain } from 'evlog/memory'
import { defineNitroPlugin } from 'nitropack/runtime'

const ODX_ROUTE_PATTERN = '/api/odx/:service/:entitySet'
const drain = createMemoryDrain({
  store: 'odx-integration',
  maxEvents: 100,
})
const loggers = new WeakMap<H3Event, RequestLogger>()

initLogger({
  env: { service: 'odx-evlog-pilot' },
  pretty: false,
  redact: true,
  silent: true,
  drain,
})

function resolveWaitUntil(event: H3Event): ((promise: Promise<unknown>) => void) | undefined {
  const candidate = event.context.cloudflare?.context ?? event.context
  return typeof candidate.waitUntil === 'function'
    ? candidate.waitUntil.bind(candidate)
    : undefined
}

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('odx:proxy:request', ({ event, serviceName }) => {
    event.context.odxOperationId = 'catalog.list:test-items'

    const logger = createRequestLogger({
      method: event.method,
      path: ODX_ROUTE_PATTERN,
      requestId: event.context.odxRequestId,
      waitUntil: resolveWaitUntil(event),
    })
    logger.set({
      operation: 'odx.proxy',
      odx: {
        requestId: event.context.odxRequestId,
        serviceId: serviceName,
      },
    })
    event.context.log = logger
    loggers.set(event, logger)
  })

  nitroApp.hooks.hook('odx:proxy:request:TestService', ({ event }) => {
    event.context.log?.set({
      host: { integrationLayer: 'service-hook' },
    })
  })

  nitroApp.hooks.hook('odx:proxy:telemetry', ({ event, summary }) => {
    const logger = loggers.get(event)
    if (!logger)
      return

    logger.set({
      status: summary.status,
      odx: summary,
    })
    logger.emit()
    loggers.delete(event)
  })
})
