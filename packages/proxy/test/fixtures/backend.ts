import { createApp, createRouter, defineEventHandler } from 'h3'

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
