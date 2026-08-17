import { createError, defineEventHandler, getHeaders, getQuery, getRequestURL } from 'h3'

export default defineEventHandler((event) => {
  if (getRequestURL(event).pathname !== '/sap/opu/odata/sap/Northwind/Categories') {
    throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  }

  const query = getQuery(event)
  const headers = getHeaders(event)
  if (
    query.$filter !== 'CategoryID eq 1'
    || query.$select !== 'CategoryID,CategoryName'
    || query.$top !== '1'
  ) {
    throw createError({ statusCode: 400, statusMessage: 'Unexpected Northwind query' })
  }
  if (headers.accept !== 'application/json') {
    throw createError({ statusCode: 406, statusMessage: 'OData JSON response required' })
  }

  return {
    d: {
      results: [{
        __metadata: {
          type: 'NorthwindModel.Category',
          uri: 'http://localhost/sap/opu/odata/sap/Northwind/Categories(1)',
        },
        CategoryID: 1,
        CategoryName: 'Beverages',
      }],
    },
  }
})
