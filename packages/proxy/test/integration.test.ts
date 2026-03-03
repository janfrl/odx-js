import { createServer } from 'node:http'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { toNodeListener } from 'h3'
import { getPort } from 'get-port-please'
import { ofetch } from 'ofetch'
import { createBackend } from './fixtures/backend'
import { createProxyServer } from './fixtures/server'
import type { ODataProxyConfig } from '@bc8-odx/core'

describe('proxy integration', () => {
  let backendServer: any
  let proxyServer: any
  let backendUrl: string
  let proxyUrl: string

  beforeAll(async () => {
    // 1. Spin up dummy SAP backend
    const backendPort = await getPort()
    backendServer = createServer(toNodeListener(createBackend()))
    await new Promise((resolve) => backendServer.listen(backendPort, () => resolve(true)))
    backendUrl = `http://localhost:${backendPort}`

    // 2. Configure and spin up proxy server
    const proxyPort = await getPort()
    const config: ODataProxyConfig = {
      services: [
        {
          name: 'TestService',
          url: backendUrl + '/sap/opu/odata/sap/TestService/',
          strategy: 'proxied'
        }
      ],
      basePath: '/api/odata',
      buildDir: '',
      rootDir: '',
      mode: 'sdk'
    }

    proxyServer = createServer(toNodeListener(createProxyServer(config)))
    await new Promise((resolve) => proxyServer.listen(proxyPort, () => resolve(true)))
    proxyUrl = `http://localhost:${proxyPort}`
  })

  afterAll(async () => {
    await new Promise((resolve) => backendServer.close(() => resolve(true)))
    await new Promise((resolve) => proxyServer.close(() => resolve(true)))
  })

  it('proxies GET request to backend and returns flattened data', async () => {
    const response = await ofetch(`${proxyUrl}/api/odata/TestService/Products`)
    
    // Check if data is passed through and flattened by our core utility
    expect(Array.isArray(response)).toBe(true)
    expect(response[0].Name).toBe('Test Product')
  })

  it('handles CSRF token preflight', async () => {
    const response = await ofetch(`${proxyUrl}/api/odata/TestService/Products`, {
      headers: {
        'x-csrf-token': 'fetch'
      }
    })
    
    expect(Array.isArray(response)).toBe(true)
  })
})
