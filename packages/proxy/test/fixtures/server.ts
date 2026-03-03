import type { ODataProxyConfig } from '@bc8-odx/core'
import { createApp, createRouter } from 'h3'
import { createODataHandler } from '../../src'

export function createProxyServer(config: ODataProxyConfig): ReturnType<typeof createApp> {
  const app = createApp()
  const router = createRouter()

  router.use('/api/odata/**', createODataHandler(config))

  app.use(router)
  return app
}
