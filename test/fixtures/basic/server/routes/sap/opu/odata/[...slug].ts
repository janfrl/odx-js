import { defineEventHandler, fromNodeMiddleware } from 'h3'
import pkg from '@sap-ux/fe-mockserver-core'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const FEMockserver = (pkg as any).default || pkg
let mockHandler: any

const __dirname = dirname(fileURLToPath(import.meta.url))
const fixtureDir = resolve(__dirname, '../../../../../../')

export default defineEventHandler(async (event) => {
  if (!mockHandler) {
    const mockserver = new FEMockserver({
      services: [{
        urlPath: '/sap/opu/odata/sap/TestService',
        metadataPath: resolve(fixtureDir, 'edmx/test-v2.edmx'),
        mockdataPath: resolve(fixtureDir, 'server/mockdata/TestService'),
      }],
      debug: false,
    })

    await mockserver.isReady
    mockHandler = fromNodeMiddleware(mockserver.getRouter())
  }

  return mockHandler(event)
})
