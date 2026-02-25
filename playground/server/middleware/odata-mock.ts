import { fromNodeMiddleware, defineEventHandler } from 'h3'
import pkg from '@sap-ux/fe-mockserver-core'
import { resolve } from 'node:path'

const FEMockserver = (pkg as any).default || pkg
let mockHandler: any

export default defineEventHandler(async (event) => {
  // Only handle SAP OData paths
  if (!event.path.startsWith('/sap/opu/odata/')) return

  if (!mockHandler) {
    console.log('Lazy-initializing OData Mock Server in Middleware...')
    const metadataPath = resolve(process.cwd(), 'playground/edmx/dummy.edmx')
    const mockdataPath = resolve(process.cwd(), 'playground/server/mockdata/DummyService')

    const mockserver = new FEMockserver({
      services: [{
        urlPath: '/sap/opu/odata/sap/DUMMY_SRV',
        metadataPath,
        mockdataPath,
      }],
    })

    await mockserver.isReady
    mockHandler = fromNodeMiddleware(mockserver.getRouter())
    console.log('OData Mock Server is ready (Middleware).')
  }

  return mockHandler(event)
})
