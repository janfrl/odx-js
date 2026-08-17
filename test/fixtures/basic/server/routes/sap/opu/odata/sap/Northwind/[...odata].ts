import { createError, defineEventHandler, getHeaders, getMethod, getQuery, getRequestURL, setHeader } from 'h3'

export default defineEventHandler((event) => {
  if (getMethod(event) !== 'GET') {
    throw createError({ statusCode: 405, statusMessage: 'Method Not Allowed' })
  }

  const pathname = getRequestURL(event).pathname
  const query = getQuery(event)
  const headers = getHeaders(event)
  if (headers.accept !== 'application/json') {
    throw createError({ statusCode: 406, statusMessage: 'OData JSON response required' })
  }

  if (pathname === '/sap/opu/odata/sap/Northwind/Categories(1)') {
    if (
      query.$select !== 'CategoryID,CategoryName'
      || Object.keys(query).length !== 1
    ) {
      throw createError({ statusCode: 400, statusMessage: 'Unexpected Northwind key query' })
    }

    setHeader(event, 'ETag', 'W/"northwind-category-1"')

    return {
      d: createCategory(),
    }
  }

  if (pathname === '/sap/opu/odata/sap/Northwind/Categories(1)/Products') {
    if (
      query.$select !== 'ProductID,ProductName'
      || query.$top !== '1'
      || Object.keys(query).length !== 2
    ) {
      throw createError({ statusCode: 400, statusMessage: 'Unexpected Northwind navigation query' })
    }

    return {
      d: {
        results: [{
          __metadata: {
            type: 'NorthwindModel.Product',
            uri: 'http://localhost/sap/opu/odata/sap/Northwind/Products(1)',
          },
          ProductID: 1,
          ProductName: 'Chai',
        }],
      },
    }
  }

  if (pathname !== '/sap/opu/odata/sap/Northwind/Categories') {
    throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  }

  if (
    query.$filter !== 'CategoryID eq 1'
    || (query.$inlinecount !== undefined && query.$inlinecount !== 'allpages')
    || query.$select !== 'CategoryID,CategoryName'
    || query.$top !== '1'
  ) {
    throw createError({ statusCode: 400, statusMessage: 'Unexpected Northwind query' })
  }
  return {
    d: {
      ...(query.$inlinecount === 'allpages' ? { __count: '49' } : {}),
      results: [createCategory()],
    },
  }
})

function createCategory(): Record<string, unknown> {
  return {
    __metadata: {
      type: 'NorthwindModel.Category',
      uri: 'http://localhost/sap/opu/odata/sap/Northwind/Categories(1)',
    },
    CategoryID: 1,
    CategoryName: 'Beverages',
  }
}
