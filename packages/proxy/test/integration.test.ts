import type { ODataProxyConfig, ODataProxyHooks } from '@bc8-odx/core'
import { createServer } from 'node:http'
import { clearODataLogs, getODataLogs } from '@bc8-odx/core'
import { getPort } from 'get-port-please'
import { toNodeListener } from 'h3'
import { createHooks } from 'hookable'
import { ofetch } from 'ofetch'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
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
          proxyMode: 'buffer',
        },
        {
          name: 'MockService',
          url: '', // Results in relative /sap/opu/odata/sap/MockService
          strategy: 'proxied',
          proxyMode: 'buffer',
        },
        {
          name: 'DirectService',
          url: backendUrl,
          strategy: 'direct',
        },
        {
          name: 'OverrideService',
          url: backendUrl,
          strategy: 'proxied',
          proxyMode: 'buffer',
          headers: {
            'x-priority-test': 'config-default',
          },
        },
        {
          name: 'AuthLogService',
          url: backendUrl,
          strategy: 'proxied',
          proxyMode: 'buffer',
          auth: {
            username: 'configured-user',
            password: 'configured-password',
          },
        },
      ],
      basePath: '/api/odx',
      buildDir: '',
      rootDir: '',
      mode: 'sdk',
      devtools: {
        enabled: true,
        maxLogs: 100,
      },
      hooks,
    }

    proxyServer = createServer(toNodeListener(createProxyServer(config)))
    await new Promise(resolve => proxyServer.listen(proxyPort, () => resolve(true)))
    proxyUrl = `http://127.0.0.1:${proxyPort}`
  }, 20000)

  afterAll(async () => {
    const closeServer = (server: any) => new Promise((resolve) => {
      if (!server)
        return resolve(true)
      const timeout = setTimeout(() => {
        server.closeAllConnections?.()
        resolve(true)
      }, 2000)
      server.close(() => {
        clearTimeout(timeout)
        resolve(true)
      })
    })

    await Promise.all([
      closeServer(backendServer),
      closeServer(proxyServer),
    ])
  }, 20000)

  it('proxies GET request to backend and returns data', async () => {
    const response = await ofetch(`${proxyUrl}/api/odx/TestService/Products`)
    expect(response.d.results).toBeDefined()
    expect(Array.isArray(response.d.results)).toBe(true)
    expect(response.d.results[0].Name).toBe('Test Product')
  })

  it('preserves successful backend status in buffered responses and DevTools logs', async () => {
    clearODataLogs()

    const response = await ofetch.raw(`${proxyUrl}/api/odx/TestService/CreatedProducts`, {
      method: 'POST',
      body: {
        Name: 'Created Product',
      },
    })

    expect(response.status).toBe(201)
    expect(response._data.d).toMatchObject({
      ID: 'created-1',
      Name: 'Created Product',
    })

    const [log] = await getODataLogs()
    expect(log?.status).toBe(201)
    expect(log?.responseBody).toMatchObject({
      ID: 'created-1',
      Name: 'Created Product',
    })
  })

  it('stores proxy trace entries in enabled DevTools logs', async () => {
    clearODataLogs()

    await ofetch(`${proxyUrl}/api/odx/TestService/Products`)

    const [log] = await getODataLogs()
    expect(log?.proxyTrace).toEqual(expect.arrayContaining([
      expect.objectContaining({
        label: 'Proxy',
        message: expect.stringContaining('Forwarding request to:'),
        status: 'info',
      }),
      expect.objectContaining({
        label: 'Response',
        message: 'Request successful',
        status: 'success',
      }),
    ]))
  })

  it('preserves 204 No Content in buffered responses and DevTools logs', async () => {
    clearODataLogs()

    const response = await ofetch.raw(`${proxyUrl}/api/odx/TestService/CreatedProducts`, {
      method: 'POST',
      body: {
        NoContent: true,
      },
    })

    expect(response.status).toBe(204)
    expect(response._data).toBeUndefined()

    const [log] = await getODataLogs()
    expect(log?.status).toBe(204)
    expect(log?.responseBody).toBeUndefined()
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

  it('triggers generic and service-specific buffered response hooks', async () => {
    const genericResponseSpy = vi.fn()
    const serviceResponseSpy = vi.fn()

    hooks.hookOnce('odx:proxy:response', genericResponseSpy)
    hooks.hookOnce('odx:proxy:response:TestService', serviceResponseSpy)

    await ofetch(`${proxyUrl}/api/odx/TestService/Products`)

    expect(genericResponseSpy).toHaveBeenCalledOnce()
    expect(serviceResponseSpy).toHaveBeenCalledOnce()
    expect(genericResponseSpy.mock.calls[0][0]).toMatchObject({
      serviceName: 'TestService',
    })
    expect(serviceResponseSpy.mock.calls[0][0]).toMatchObject({
      serviceName: 'TestService',
    })
  })

  it('awaits async buffered response hooks before resolving', async () => {
    let asyncHookCompleted = false

    hooks.hookOnce('odx:proxy:response:TestService', async () => {
      await new Promise(resolve => setTimeout(resolve, 20))
      asyncHookCompleted = true
    })

    await ofetch(`${proxyUrl}/api/odx/TestService/Products`)

    expect(asyncHookCompleted).toBe(true)
  })

  it('forwards 500 errors from backend to client', async () => {
    try {
      await ofetch(`${proxyUrl}/api/odx/TestService/FailingEntity`)
      expect.fail('Should have thrown')
    }
    catch (err: any) {
      expect(err.status).toBe(500)
      const errorStr = JSON.stringify(err.data)
      expect(errorStr).toContain('Something went wrong')
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

  it('handles relative (mock) service URLs by prepending origin', async () => {
    const response = await ofetch(`${proxyUrl}/api/odx/MockService/Products`)
    expect(response.d.results).toBeDefined()
    expect(Array.isArray(response.d.results)).toBe(true)
    expect(response.d.results[0].Name).toBe('Mock Product')
  })

  it('bypasses hooks when using strategy: direct', async () => {
    const requestSpy = vi.fn()
    hooks.hook('odx:proxy:request', requestSpy)

    await ofetch(`${proxyUrl}/api/odx/DirectService/Products`)

    expect(requestSpy).not.toHaveBeenCalled()
  })

  it('allows client headers to override service configuration defaults', async () => {
    // 1. Check if default from config is applied
    const resDefault = await ofetch(`${proxyUrl}/api/odx/OverrideService/HeaderEcho`)
    expect(resDefault.receivedHeaders['x-priority-test']).toBe('config-default')

    // 2. Check if client override works
    const resOverride = await ofetch(`${proxyUrl}/api/odx/OverrideService/HeaderEcho`, {
      headers: {
        'x-priority-test': 'client-override',
      },
    })
    expect(resOverride.receivedHeaders['x-priority-test']).toBe('client-override')
  })

  it('does not store ODX-managed authorization values in DevTools logs', async () => {
    clearODataLogs()

    hooks.hookOnce('odx:proxy:request:AuthLogService', ({ fetchOptions }) => {
      fetchOptions.headers = {
        ...fetchOptions.headers,
        'x-hook-visible': 'logged',
      }
    })

    const response = await ofetch(`${proxyUrl}/api/odx/AuthLogService/HeaderEcho`, {
      headers: {
        'x-debug-test': 'visible',
        'x-api-key': 'client-secret',
        'cookie': 'sap-session=secret',
      },
    })

    expect(response.receivedHeaders.authorization).toMatch(/^Basic /)
    expect(response.receivedHeaders['x-hook-visible']).toBe('logged')

    const [log] = await getODataLogs()
    expect(log?.requestHeaders?.['x-debug-test']).toBe('visible')
    expect(log?.requestHeaders?.['x-hook-visible']).toBe('logged')
    expect(log?.requestHeaders?.['x-api-key']).toBe('[Redacted]')
    expect(log?.requestHeaders?.cookie).toBe('[Redacted]')
    expect(log?.requestHeaders?.authorization).toBeUndefined()
  })

  it('rewrites ?id= query parameter to OData path format', async () => {
    const resString = await ofetch(`${proxyUrl}/api/odx/TestService/EchoURL/Products?id=HT-1000`)
    expect(resString.url).toBe('/EchoURL/Products(\'HT-1000\')')

    const resNumber = await ofetch(`${proxyUrl}/api/odx/TestService/EchoURL/Products?id=123`)
    expect(resNumber.url).toBe('/EchoURL/Products(123)')
  })
})
