import type { App, H3Event } from 'h3'
import { createApp, createError, createRouter, defineEventHandler, getHeaders, readBody, setResponseStatus } from 'h3'

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
  let tokenlessMutationCount = 0

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

  router.post('/CreatedProducts', defineEventHandler(async (event) => {
    const body = await readBody(event)
    if (body?.NoContent) {
      setResponseStatus(event, 204, 'No Content')
      event.node.res.setHeader('etag', 'W/"created-2"')
      event.node.res.setHeader('location', 'CreatedProducts(2)')
      event.node.res.setHeader('odata-entityid', 'CreatedProducts(2)')
      return ''
    }

    setResponseStatus(event, 201, 'Created')
    const entityLocation = body?.RelativeIdentity
      ? 'CreatedProducts(1)'
      : 'https://private-backend.example.test/odata/CreatedProducts(1)'
    event.node.res.setHeader('location', entityLocation)
    event.node.res.setHeader('odata-entityid', entityLocation)

    return {
      d: {
        ID: 'created-1',
        ...body,
      },
    }
  }))

  const setCsrfSession = (event: H3Event, token: string): void => {
    event.node.res.setHeader('x-csrf-token', token)
    event.node.res.setHeader('set-cookie', [
      'SAP_SESSIONID=fresh; Path=/; HttpOnly',
      'sap-usercontext=sap-client=100; Expires=Wed, 21 Oct 2030 07:28:00 GMT; Path=/',
    ])
  }

  router.head('/CsrfProducts', defineEventHandler((event) => {
    if (event.node.req.headers['x-csrf-token'] === 'Fetch')
      setCsrfSession(event, 'csrf-head-token')
    return ''
  }))

  router.get('/CsrfProducts', defineEventHandler((event) => {
    if (event.node.req.headers['x-csrf-token'] === 'Fetch')
      setCsrfSession(event, 'csrf-get-token')
    return { d: { results: [] } }
  }))

  const handleCsrfMutation = defineEventHandler(async (event) => {
    const headers = getHeaders(event)
    const token = headers['x-csrf-token']
    const cookie = headers.cookie || ''
    const validToken = token === 'csrf-head-token' || token === 'csrf-get-token'
    const validSession = cookie.includes('SAP_SESSIONID=fresh')
      && cookie.includes('sap-usercontext=sap-client=100')

    if (!validToken || !validSession) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Invalid SAP mutation session',
      })
    }
    if (headers['if-match'] !== 'W/"1"') {
      throw createError({
        statusCode: 412,
        statusMessage: 'Precondition Failed',
      })
    }

    let body: any
    if ((event.method as string) === 'MERGE') {
      let rawBody = ''
      for await (const chunk of event.node.req) {
        rawBody += typeof chunk === 'string' || chunk instanceof Uint8Array
          ? chunk.toString()
          : JSON.stringify(chunk)
      }
      body = JSON.parse(rawBody)
    }
    else {
      body = await readBody(event)
    }
    event.node.res.setHeader('etag', 'W/"2"')
    event.node.res.setHeader('set-cookie', 'SAP_FINAL_SESSION=private; Path=/; HttpOnly')
    return {
      d: {
        ...body,
        csrfValidated: validToken,
        sessionValidated: validSession,
        preflightMethod: token === 'csrf-head-token' ? 'HEAD' : 'GET',
        ifMatch: headers['if-match'],
      },
    }
  })
  router.patch('/CsrfProducts', handleCsrfMutation)
  router.add('/CsrfProducts', handleCsrfMutation, 'merge' as any)

  router.head('/TokenlessCsrfProducts', defineEventHandler(() => ''))
  router.get('/TokenlessCsrfProducts', defineEventHandler(() => ({ d: { results: [] } })))
  router.patch('/TokenlessCsrfProducts', defineEventHandler(() => {
    tokenlessMutationCount += 1
    return { d: { reached: true } }
  }))
  router.get('/TokenlessCsrfStats', defineEventHandler(() => ({ tokenlessMutationCount })))

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
