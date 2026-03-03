import type { ODataProxyConfig, ODataProxyHooks } from '@bc8-odx/core'
import { createServer } from 'node:http'
import { getPort } from 'get-port-please'
import { toNodeListener } from 'h3'
import { ofetch } from 'ofetch'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { createHooks } from 'hookable'
import { createBackend } from './fixtures/backend'
import { createProxyServer } from './fixtures/server'

describe('proxy integration', () => {
  let backendServer: any
  let proxyServer: any
  let backendUrl: string
  let proxyUrl: string
  const hooks = createHooks<ODataProxyHooks>()

  beforeAll(async () => {
    // 1. Spin up dummy backend
    const backendPort = await getPort()
    backendServer = createServer(toNodeListener(createBackend()))
    await new Promise(resolve => backendServer.listen(backendPort, () => resolve(true)))
    backendUrl = `http://127.0.0.1:${backendPort}`

    // 2. Configure and spin up proxy server
    const proxyPort = await getPort()
    const config: ODataProxyConfig = {
      services: [
        {
          name: 'TestService',
          url: backendUrl,
          strategy: 'proxied',
        },
      ],
      basePath: '/api/odx',
      buildDir: '',
      rootDir: '',
      mode: 'sdk',
      hooks,
    }

    proxyServer = createServer(toNodeListener(createProxyServer(config)))
    await new Promise(resolve => proxyServer.listen(proxyPort, () => resolve(true)))
    proxyUrl = `http://127.0.0.1:${proxyPort}`
  })

  afterAll(async () => {
    await new Promise(resolve => backendServer.close(() => resolve(true)))
    await new Promise(resolve => proxyServer.close(() => resolve(true)))
  })

  it('proxies GET request to backend and returns data', async () => {
    const response = await ofetch(`${proxyUrl}/api/odx/TestService/Products`)
    expect(Array.isArray(response)).toBe(true)
    expect(response[0].Name).toBe('Test Product')
  })

  it('triggers interception hooks', async () => {
    const requestSpy = vi.fn()
    const responseSpy = vi.fn()

    hooks.hook('odx:proxy:request', requestSpy)
    hooks.hook('odx:proxy:response', responseSpy)

    await ofetch(`${proxyUrl}/api/odx/TestService/Products`)

    expect(requestSpy).toHaveBeenCalled()
    expect(responseSpy).toHaveBeenCalled()
    
    const ctx = requestSpy.mock.calls[0][0]
    expect(ctx.serviceName).toBe('TestService')
  })

  it('forwards 500 errors from backend to client', async () => {
    try {
      await ofetch(`${proxyUrl}/api/odx/TestService/FailingEntity`)
      expect.fail('Should have thrown')
    }
    catch (err: any) {
      expect(err.status).toBe(500)
      // Navigating the nested h3 error structure returned by ofetch
      // The structure is err.data (ofetch body) -> .data (proxy error data) -> .data (backend error data) -> .message
      expect(err.data.data.data.message).toBe('Something went wrong')
    }
  })

  it('passes through custom headers to the backend', async () => {
    const response = await ofetch(`${proxyUrl}/api/odx/TestService/HeaderEcho`, {
      headers: {
        'x-custom-test': 'it-works',
      },
    })

    const received = response.receivedHeaders
    expect(received['x-custom-test']).toBe('it-works')
  })
})
