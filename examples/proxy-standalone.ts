import type { ODataProxyConfig } from '@bc8-odx/core'
import type { AddressInfo } from 'node:net'
import { createServer } from 'node:http'
import process from 'node:process'
import { createODataHandler } from '@bc8-odx/proxy'
import { createApp, createRouter, toNodeListener } from 'h3'
import { ofetch } from 'ofetch'
import { createBackend } from '../packages/proxy/test/fixtures/backend'

function listen(app: ReturnType<typeof createApp>): Promise<{ close: () => Promise<void>, url: string }> {
  const server = createServer(toNodeListener(app))

  return new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      server.off('error', reject)
      const address = server.address() as AddressInfo
      resolve({
        url: `http://127.0.0.1:${address.port}`,
        close: () => new Promise((closeResolve) => {
          const timeout = setTimeout(() => {
            server.closeAllConnections?.()
            closeResolve()
          }, 2000)

          server.close(() => {
            clearTimeout(timeout)
            closeResolve()
          })
        }),
      })
    })
  })
}

async function main(): Promise<void> {
  const backend = await listen(createBackend())

  const config: ODataProxyConfig = {
    services: [
      {
        name: 'TestService',
        url: backend.url,
        strategy: 'proxied',
        proxyMode: 'buffer',
      },
    ],
    basePath: '/api/odx',
    buildDir: '',
    rootDir: '',
    mode: 'sdk',
    devtools: {
      enabled: false,
    },
  }

  const proxyApp = createApp()
  const router = createRouter()
  router.use(`${config.basePath}/**`, createODataHandler(config))
  proxyApp.use(router)

  const proxy = await listen(proxyApp)

  try {
    const products = await ofetch(`${proxy.url}/api/odx/TestService/Products`)
    const echoedHeaders = await ofetch(`${proxy.url}/api/odx/TestService/HeaderEcho`, {
      headers: {
        'x-standalone-example': 'core-proxy',
      },
    })

    console.warn(JSON.stringify({
      package: '@bc8-odx/proxy',
      backendUrl: backend.url,
      proxyUrl: proxy.url,
      requestPath: '/api/odx/TestService/Products',
      productCount: products.d.results.length,
      firstProduct: products.d.results[0],
      forwardedHeader: echoedHeaders.receivedHeaders['x-standalone-example'],
    }, null, 2))
  }
  finally {
    await Promise.all([
      proxy.close(),
      backend.close(),
    ])
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
