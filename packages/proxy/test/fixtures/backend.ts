import { createApp, createRouter, defineEventHandler, createError, getHeaders } from 'h3'

export const createBackend = () => {
  const app = createApp()
  const router = createRouter()

  router.get('/sap/opu/odata/sap/TestService/Products', defineEventHandler(() => {
    return {
      d: {
        results: [
          { ID: '1', Name: 'Test Product' }
        ]
      }
    }
  }))

  // Endpoint that always throws a 500 error
  router.get('/sap/opu/odata/sap/TestService/FailingEntity', defineEventHandler(() => {
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error from SAP',
      data: { message: 'Something went wrong in the ABAP backend' }
    })
  }))

  // Endpoint to verify header passthrough
  router.get('/sap/opu/odata/sap/TestService/HeaderEcho', defineEventHandler((event) => {
    const headers = getHeaders(event)
    return {
      receivedHeaders: headers
    }
  }))

  // Handle CSRF token fetch
  router.get('/sap/opu/odata/sap/TestService/', defineEventHandler((event) => {
    const csrfFetch = event.node.req.headers['x-csrf-token']
    if (csrfFetch === 'fetch') {
      event.node.res.setHeader('x-csrf-token', 'dummy-token')
    }
    return { d: { EntitySets: ['Products'] } }
  }))

  app.use(router)
  return app
}
