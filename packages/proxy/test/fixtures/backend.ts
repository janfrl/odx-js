import type { App } from 'h3'
import { createApp, createError, createRouter, defineEventHandler, getHeaders } from 'h3'

const largeProducts = Array.from({ length: 500 }, (_, index) => {
  const id = String(index + 1).padStart(4, '0')

  return {
    ID: id,
    Name: `Benchmark Product ${id}`,
    Category: `Category ${(index % 12) + 1}`,
    Description: `Deterministic benchmark payload row ${id} with enough repeated content to exercise proxy buffering and streaming overhead.`,
    Price: Number((10 + index * 1.17).toFixed(2)),
    Currency: 'EUR',
    InStock: index % 5 !== 0,
    Supplier: {
      ID: `SUP-${String((index % 25) + 1).padStart(3, '0')}`,
      Name: `Supplier ${(index % 25) + 1}`,
    },
    Tags: [`group-${index % 7}`, `tier-${index % 3}`, `region-${index % 4}`],
  }
})

/**
 * Creates a mock backend server for testing OData proxy functionality.
 */
export function createBackend(): App {
  const app = createApp()
  const router = createRouter()

  router.get('/Products', defineEventHandler(() => {
    return {
      d: {
        results: [
          { ID: '1', Name: 'Test Product' },
        ],
      },
    }
  }))

  router.get('/LargeProducts', defineEventHandler(() => {
    return {
      d: {
        results: largeProducts,
      },
    }
  }))

  router.get('/FailingEntity', defineEventHandler(() => {
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      data: { message: 'Something went wrong' },
    })
  }))

  router.get('/HeaderEcho', defineEventHandler((event) => {
    const headers = getHeaders(event)
    return {
      receivedHeaders: headers,
    }
  }))

  router.use('/EchoURL/**', defineEventHandler((event) => {
    return {
      url: event.path,
    }
  }))

  router.get('/', defineEventHandler((event) => {
    const csrfFetch = event.node.req.headers['x-csrf-token']
    if (csrfFetch === 'fetch') {
      event.node.res.setHeader('x-csrf-token', 'dummy-token')
    }
    return { d: { EntitySets: ['Products'] } }
  }))

  app.use(router)
  return app
}
