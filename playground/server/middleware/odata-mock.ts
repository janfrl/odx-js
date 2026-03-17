import type { ODataProxyConfig, ODataServiceConfig } from '@bc8-odx/core'
import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineEventHandler, fromNodeMiddleware, useRuntimeConfig } from '#imports'
import pkg from '@sap-ux/fe-mockserver-core'

const __dirname = dirname(fileURLToPath(import.meta.url))

/**
 * Interface for mock server service configuration.
 */
interface MockServiceConfig {
  urlPath: string
  metadataPath: string
  mockdataPath: string
}

const FEMockserver = (pkg as any).default || pkg
let mockHandler: any

export default defineEventHandler(async (event) => {
  const sapPrefix = '/sap/opu/odata/sap/'
  if (!event.path.startsWith(sapPrefix)) {
    return
  }

  if (!mockHandler) {
    const config = useRuntimeConfig().odata as unknown as ODataProxyConfig
    const services: ODataServiceConfig[] = config.services || []

    const playgroundRoot = resolve(__dirname, '../..')

    const mockServices: MockServiceConfig[] = services
      .filter((s: ODataServiceConfig) => s.url && !s.url.startsWith('http'))
      .map((s: ODataServiceConfig) => {
        const metadataPath = resolve(playgroundRoot, s.url)
        const mockdataPath = resolve(playgroundRoot, 'server/mockdata', s.name)

        return {
          urlPath: `${sapPrefix}${s.name}`,
          metadataPath,
          mockdataPath,
        }
      })

    if (mockServices.length === 0) {
      return
    }

    try {
      const mockserver = new FEMockserver({
        services: mockServices,
        debug: false,
      })

      await mockserver.isReady
      mockHandler = fromNodeMiddleware(mockserver.getRouter())
    }
    catch (err: any) {
      // Ignored in dev
    }
  }

  if (mockHandler) {
    return mockHandler(event)
  }
})
