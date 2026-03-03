import type { App } from 'h3'
import { createApp, createError, createRouter, defineEventHandler, getHeaders } from 'h3'

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
