import { resolve } from 'node:path'
import process from 'node:process'
import { defineEventHandler, fromNodeMiddleware, useRuntimeConfig } from '#imports'
import pkg from '@sap-ux/fe-mockserver-core'

const FEMockserver = (pkg as any).default || pkg
let mockHandler: any

export default defineEventHandler(async (event) => {
  // Only intercept OData paths
  if (!event.path.startsWith('/sap/opu/odata/'))
    return

  if (!mockHandler) {
    const config = useRuntimeConfig().odata
    const services = config.services || []

    // Filter for services that have a local URL (relative path to EDMX)
    const mockServices = services
      .filter((s: any) => s.url && !s.url.startsWith('http'))
      .map((s: any) => {
        console.warn(`[MockServer] Registering dynamic service: ${s.name}`)
        return {
          urlPath: `/sap/opu/odata/sap/${s.name}`,
          metadataPath: resolve(process.cwd(), 'playground', s.url),
          mockdataPath: resolve(process.cwd(), 'playground/server/mockdata', s.name),
        }
      })

    if (mockServices.length === 0) {
      return
    }

    const mockserver = new FEMockserver({
      services: mockServices,
      debug: true,
    })

    await mockserver.isReady
    mockHandler = fromNodeMiddleware(mockserver.getRouter())
    console.warn(`[MockServer] Initialized with ${mockServices.length} services.`)
  }

  return mockHandler(event)
})
