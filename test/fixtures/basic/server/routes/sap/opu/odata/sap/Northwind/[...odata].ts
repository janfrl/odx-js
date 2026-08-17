import { createError, defineEventHandler, getHeaders, getMethod, getQuery, getRequestURL, readBody, setHeader } from 'h3'
import { getNorthwindCategory, getNorthwindCategoryEtag, updateNorthwindCategory } from '../../../../../../utils/northwind-category'

export default defineEventHandler(async (event) => {
  const pathname = getRequestURL(event).pathname
  const query = getQuery(event)
  const headers = getHeaders(event)
  if (headers.accept !== 'application/json') {
    throw createError({ statusCode: 406, statusMessage: 'OData JSON response required' })
  }

  if (pathname === '/sap/opu/odata/sap/Northwind/Categories(1)') {
    if (getMethod(event) === 'PATCH') {
      if (headers['if-match'] !== getNorthwindCategoryEtag()) {
        throw createError({ statusCode: 412, statusMessage: 'Precondition Failed' })
      }

      const body = await readBody<Record<string, unknown>>(event)
      if (
        Object.keys(body).length !== 1
        || typeof body.CategoryName !== 'string'
        || body.CategoryName.length === 0
      ) {
        throw createError({ statusCode: 400, statusMessage: 'Unexpected Northwind update' })
      }

      updateNorthwindCategory(body.CategoryName)
      setHeader(event, 'ETag', getNorthwindCategoryEtag())
      return { d: createCategory() }
    }

    if (getMethod(event) !== 'GET') {
      throw createError({ statusCode: 405, statusMessage: 'Method Not Allowed' })
    }

    if (
      query.$select !== 'CategoryID,CategoryName'
      || Object.keys(query).length !== 1
    ) {
      throw createError({ statusCode: 400, statusMessage: 'Unexpected Northwind key query' })
    }

    setHeader(event, 'ETag', getNorthwindCategoryEtag())

    return {
      d: createCategory(),
    }
  }

  if (getMethod(event) !== 'GET') {
    throw createError({ statusCode: 405, statusMessage: 'Method Not Allowed' })
  }

  if (pathname === '/sap/opu/odata/sap/Northwind/Categories(1)/Products') {
    if (
      query.$orderby === 'ProductID'
      && query.$select === 'ProductID,ProductName'
      && query.$top === '1'
      && query.$skiptoken === undefined
      && Object.keys(query).length === 3
    ) {
      return {
        d: {
          results: [createProduct(1, 'Chai')],
          __next: 'https://private.northwind.example/sap/opu/odata/sap/Northwind/Categories(1)/Products?%24orderby=ProductID&%24select=ProductID%2CProductName&%24top=1&%24skiptoken=ProductID-1',
        },
      }
    }

    if (
      query.$orderby === 'ProductID'
      && query.$select === 'ProductID,ProductName'
      && query.$top === '1'
      && query.$skiptoken === 'ProductID-1'
      && Object.keys(query).length === 4
    ) {
      return {
        d: {
          results: [createProduct(2, 'Chang')],
        },
      }
    }

    if (
      query.$select !== 'ProductID,ProductName'
      || query.$top !== '1'
      || Object.keys(query).length !== 2
    ) {
      throw createError({ statusCode: 400, statusMessage: 'Unexpected Northwind navigation query' })
    }

    return {
      d: {
        results: [createProduct(1, 'Chai')],
      },
    }
  }

  if (pathname !== '/sap/opu/odata/sap/Northwind/Categories') {
    throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  }

  if (
    query.$orderby === 'CategoryID'
    && query.$select === 'CategoryID,CategoryName'
    && query.$top === '1'
    && query.$skiptoken === undefined
    && Object.keys(query).length === 3
  ) {
    return {
      d: {
        results: [createCategory()],
        __next: 'https://private.northwind.example/sap/opu/odata/sap/Northwind/Categories?%24orderby=CategoryID&%24select=CategoryID%2CCategoryName&%24top=1&%24skiptoken=CategoryID-1',
      },
    }
  }

  if (
    query.$orderby === 'CategoryID'
    && query.$select === 'CategoryID,CategoryName'
    && query.$top === '1'
    && query.$skiptoken === 'CategoryID-1'
    && Object.keys(query).length === 4
  ) {
    return {
      d: {
        results: [{
          __metadata: {
            type: 'NorthwindModel.Category',
            uri: 'http://localhost/sap/opu/odata/sap/Northwind/Categories(2)',
          },
          CategoryID: 2,
          CategoryName: 'Condiments',
        }],
      },
    }
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
  const category = getNorthwindCategory()
  return {
    __metadata: {
      etag: getNorthwindCategoryEtag(),
      type: 'NorthwindModel.Category',
      uri: 'http://localhost/sap/opu/odata/sap/Northwind/Categories(1)',
    },
    CategoryID: 1,
    CategoryName: category.name,
  }
}

function createProduct(productId: number, productName: string): Record<string, unknown> {
  return {
    __metadata: {
      type: 'NorthwindModel.Product',
      uri: `http://localhost/sap/opu/odata/sap/Northwind/Products(${productId})`,
    },
    ProductID: productId,
    ProductName: productName,
  }
}
