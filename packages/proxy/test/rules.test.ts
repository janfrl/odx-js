import type { ODataProxyConfig, ODataProxyHooks } from '@bc8-odx/core'
import { createServer } from 'node:http'
import { getPort } from 'get-port-please'
import { toNodeListener } from 'h3'
import { createHooks } from 'hookable'
import { ofetch } from 'ofetch'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { odataGuard } from '../src'
import { createBackend } from './fixtures/backend'
import { createProxyServer } from './fixtures/server'

describe('proxy rules', () => {
  let backendServer: any
  let proxyServer: any
  let backendUrl: string
  let proxyUrl: string
  const hooks = createHooks<ODataProxyHooks>()

  beforeAll(async () => {
    // 1. Backend
    const backendPort = await getPort()
    backendServer = createServer(toNodeListener(createBackend()))
    await new Promise(resolve => backendServer.listen(backendPort, () => resolve(true)))
    backendUrl = `http://127.0.0.1:${backendPort}`

    // 2. Proxy
    const proxyPort = await getPort()
    const config: ODataProxyConfig = {
      services: [
        {
          name: 'RestrictedService',
          url: backendUrl,
          strategy: 'proxied',
          proxyMode: 'buffer',
          rules: [
            { type: 'allowOnlyMethods', value: ['GET'] },
            { type: 'denyPath', value: '/Sensitive' },
          ],
        },
        {
          name: 'HeaderService',
          url: backendUrl,
          strategy: 'proxied',
          proxyMode: 'buffer',
          rules: [
            { type: 'injectHeader', value: { name: 'x-injected', value: 'secret-key' } },
          ],
        },
        {
          name: 'RewriteService',
          url: backendUrl,
          strategy: 'proxied',
          proxyMode: 'buffer',
          rules: [
            { type: 'rewritePath', value: { pattern: '/OldPath', replacement: '/Products' } },
          ],
        },
        {
          name: 'HookService',
          url: backendUrl,
          strategy: 'proxied',
          proxyMode: 'buffer',
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
  }, 20000)

  afterAll(async () => {
    const closeServer = (server: any) => new Promise((resolve) => {
      if (!server)
        return resolve(true)
      server.close(() => resolve(true))
    })
    await Promise.all([
      closeServer(backendServer),
      closeServer(proxyServer),
    ])
  }, 20000)

  it('allows GET but denies POST on RestrictedService', async () => {
    const getRes = await ofetch(`${proxyUrl}/api/odx/RestrictedService/Products`)
    expect(getRes).toBeDefined()

    try {
      await ofetch(`${proxyUrl}/api/odx/RestrictedService/Products`, {
        method: 'POST',
        body: { Name: 'New Product' },
        headers: { 'Content-Type': 'application/json' },
      })
      expect.fail('Should have denied POST')
    }
    catch (err: any) {
      expect(err.status).toBe(405)
    }
  })

  it('denies access to paths containing Restricted keywords', async () => {
    try {
      await ofetch(`${proxyUrl}/api/odx/RestrictedService/SensitiveData`)
      expect.fail('Should have denied /SensitiveData')
    }
    catch (err: any) {
      expect(err.status).toBe(403)
    }
  })

  it('injects headers correctly from rules', async () => {
    const res = await ofetch(`${proxyUrl}/api/odx/HeaderService/HeaderEcho`)
    expect(res.receivedHeaders['x-injected']).toBe('secret-key')
  })

  it('rewrites paths correctly before forwarding', async () => {
    // Calling /OldPath should be rewritten to /Products and return dummy products
    const res = await ofetch(`${proxyUrl}/api/odx/RewriteService/OldPath`)
    expect(res.d.results).toBeDefined()
    expect(res.d.results[0].Name).toBe('Test Product')
  })

  it('allows programmatic rules via Nitro hooks', async () => {
    hooks.hook('odx:proxy:request:HookService', (ctx: any) => {
      odataGuard(ctx).denyIfPathIncludes('/HookRestricted')
    })

    try {
      await ofetch(`${proxyUrl}/api/odx/HookService/HookRestricted`)
      expect.fail('Should have denied via hook')
    }
    catch (err: any) {
      expect(err.status).toBe(403)
    }
  })
})
