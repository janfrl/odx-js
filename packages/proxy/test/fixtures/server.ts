import { createApp, createRouter, defineEventHandler } from 'h3'
import { createODataHandler } from '../../src'
import type { ODataProxyConfig } from '@bc8-odx/core'

export const createProxyServer = (config: ODataProxyConfig) => {
  const app = createApp()
  const router = createRouter()

  router.use('/api/odata/**', createODataHandler(config))

  app.use(router)
  return app
}
