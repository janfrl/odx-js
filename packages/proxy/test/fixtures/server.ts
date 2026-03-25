import type { ODataProxyConfig } from '@bc8-odx/core'
import { createApp, createRouter, defineEventHandler } from 'h3'
import { createODataHandler } from '../../src'

export function createProxyServer(config: ODataProxyConfig): ReturnType<typeof createApp> {
  const app = createApp()
  const router = createRouter()

  // Use the basePath from config for the router
  router.use(`${config.basePath}/**`, createODataHandler(config))

  // Mimic the playground's local SAP mock handler
  router.get('/sap/opu/odata/sap/MockService/Products', defineEventHandler(() => {
    return {
      d: {
        results: [
          { ID: 'MOCK', Name: 'Mock Product' },
        ],
      },
    }
  }))

  app.use(router)
  return app
}
