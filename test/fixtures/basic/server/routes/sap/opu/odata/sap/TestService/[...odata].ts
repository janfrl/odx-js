import { createError, defineEventHandler, getHeaders, getQuery } from 'h3'

/**
 * Lightweight OData V2 simulation handler for integration tests.
 */
export default defineEventHandler((event) => {
  const query = getQuery(event)
  const headers = getHeaders(event)

  const allItems = [
    { ID: '1', Title: 'Test Item 1', Value: 100 },
    { ID: '2', Title: 'Test Item 2', Value: 200 },
    { ID: '3', Title: 'Test Item 3', Value: 300 },
  ]

  if (event.path.includes('/TestItems')) {
    let results = allItems
    if (query.$top) {
      const top = parseInt(query.$top as string)
      const skip = parseInt(query.$skip as string || '0')
      results = allItems.slice(skip, skip + top)
    }
    return { d: { results } }
  }

  if (event.path.includes('/TestHeaders')) {
    return {
      authorization: headers.authorization,
      xCustomTest: headers['x-custom-test'],
    }
  }

  throw createError({
    statusCode: 404,
    statusMessage: 'Not Found',
  })
})
