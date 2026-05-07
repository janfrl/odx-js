import type { ODataProxyConfig, ODataProxyHooks } from '@bc8-odx/core'
import { createServer } from 'node:http'
import { clearODataLogs, getODataLogs } from '@bc8-odx/core'
import { getPort } from 'get-port-please'
import { toNodeListener } from 'h3'
import { createHooks } from 'hookable'
import { ofetch } from 'ofetch'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { odataGuard } from '../src'
import btpAuthPlugin from '../src/plugins/btp-auth'
import { DevToolsTracer } from '../src/utils/trace'
import { createBackend } from './fixtures/backend'
import { createProxyServer } from './fixtures/server'

const useRuntimeConfigMock = vi.hoisted(() => vi.fn())

vi.mock('nitropack/runtime', () => {
  return {
    defineNitroPlugin: (plugin: any) => plugin,
    useRuntimeConfig: useRuntimeConfigMock,
  }
})

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
          name: 'DenyMethodService',
          url: backendUrl,
          strategy: 'proxied',
          proxyMode: 'buffer',
          rules: [
            { type: 'denyMethods', value: ['DELETE'] },
          ],
        },
        {
          name: 'HeaderPolicyService',
          url: backendUrl,
          strategy: 'proxied',
          proxyMode: 'buffer',
          rules: [
            { type: 'denyIfHeader', value: { name: 'x-forbidden', value: 'true' } },
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
          name: 'XsuaaService',
          url: backendUrl,
          strategy: 'proxied',
          proxyMode: 'buffer',
          rules: [
            { type: 'requireScope', value: 'Admin' },
            { type: 'requireAttribute', value: { name: 'CostCenter', value: '1000' } },
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

  it('allows GET but denies POST on RestrictedService (allowOnlyMethods)', async () => {
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

  it('denies DELETE on DenyMethodService (denyMethods)', async () => {
    try {
      await ofetch(`${proxyUrl}/api/odx/DenyMethodService/Products`, {
        method: 'DELETE',
      })
      expect.fail('Should have denied DELETE')
    }
    catch (err: any) {
      expect(err.status).toBe(405)
    }
  })

  it('denies access based on headers (denyIfHeader)', async () => {
    try {
      await ofetch(`${proxyUrl}/api/odx/HeaderPolicyService/Products`, {
        headers: { 'x-forbidden': 'true' },
      })
      expect.fail('Should have denied due to header')
    }
    catch (err: any) {
      expect(err.status).toBe(403)
    }

    // Should allow if header is missing or different
    const res = await ofetch(`${proxyUrl}/api/odx/HeaderPolicyService/Products`)
    expect(res).toBeDefined()
  })

  it('denies access to paths containing Restricted keywords (denyIfPathIncludes)', async () => {
    try {
      await ofetch(`${proxyUrl}/api/odx/RestrictedService/SensitiveData`)
      expect.fail('Should have denied /SensitiveData')
    }
    catch (err: any) {
      expect(err.status).toBe(403)
    }
  })

  it('injects headers correctly from rules (injectHeader)', async () => {
    const res = await ofetch(`${proxyUrl}/api/odx/HeaderService/HeaderEcho`)
    expect(res.receivedHeaders['x-injected']).toBe('secret-key')
  })

  it('rewrites paths correctly before forwarding (rewritePath)', async () => {
    const res = await ofetch(`${proxyUrl}/api/odx/RewriteService/OldPath`)
    expect(res.d.results).toBeDefined()
    expect(res.d.results[0].Name).toBe('Test Product')
  })

  describe('xsuaa Security Rules', () => {
    it('denies access if scope is missing (requireScope)', async () => {
      // Mock missing scope
      hooks.hookOnce('odx:proxy:request:XsuaaService', ({ event }) => {
        event.context.securityContext = {
          checkLocalScope: () => false,
          getAttribute: () => '1000',
        }
      })

      try {
        await ofetch(`${proxyUrl}/api/odx/XsuaaService/Products`)
        expect.fail('Should have denied due to missing scope')
      }
      catch (err: any) {
        expect(err.status).toBe(403)
      }
    })

    it('denies access if attribute does not match (requireAttribute)', async () => {
      // Mock wrong attribute
      hooks.hookOnce('odx:proxy:request:XsuaaService', ({ event }) => {
        event.context.securityContext = {
          checkLocalScope: () => true,
          getAttribute: (name: string) => name === 'CostCenter' ? '9999' : null,
        }
      })

      try {
        await ofetch(`${proxyUrl}/api/odx/XsuaaService/Products`)
        expect.fail('Should have denied due to wrong attribute')
      }
      catch (err: any) {
        expect(err.status).toBe(403)
      }
    })

    it('allows access if all security conditions are met', async () => {
      hooks.hookOnce('odx:proxy:request:XsuaaService', ({ event }) => {
        event.context.securityContext = {
          checkLocalScope: (s: string) => s === 'Admin',
          getAttribute: (name: string) => name === 'CostCenter' ? '1000' : null,
        }
      })

      const res = await ofetch(`${proxyUrl}/api/odx/XsuaaService/Products`)
      expect(res).toBeDefined()
    })
  })

  it('supports custom validation rules (validate)', async () => {
    hooks.hookOnce('odx:proxy:request:HookService', (ctx: any) => {
      odataGuard(ctx).validate('TimeCheck', () => false, 'Test failure')
    })

    try {
      await ofetch(`${proxyUrl}/api/odx/HookService/Products`)
      expect.fail('Should have failed validation')
    }
    catch (err: any) {
      expect(err.status).toBe(403)
      expect(err.statusMessage).toContain('Test failure')
    }
  })

  it('rejects async custom validation rules that resolve false', async () => {
    hooks.hookOnce('odx:proxy:request:HookService', async (ctx: any) => {
      await odataGuard(ctx).validate('AsyncDeny', async () => false, 'Async failure')
    })

    try {
      await ofetch(`${proxyUrl}/api/odx/HookService/Products`)
      expect.fail('Should have failed async validation')
    }
    catch (err: any) {
      expect(err.status).toBe(403)
      expect(err.statusMessage).toContain('Async failure')
    }
  })

  it('allows async custom validation rules that resolve true', async () => {
    hooks.hookOnce('odx:proxy:request:HookService', async (ctx: any) => {
      await odataGuard(ctx).validate('AsyncAllow', async () => true, 'Should not fail')
    })

    const res = await ofetch(`${proxyUrl}/api/odx/HookService/Products`)
    expect(res).toBeDefined()
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

  it('records info traces without blocking (info)', async () => {
    hooks.hookOnce('odx:proxy:request:HookService', (ctx: any) => {
      odataGuard(ctx).info('Processing request', { timestamp: Date.now() })
    })

    const res = await ofetch(`${proxyUrl}/api/odx/HookService/Products`)
    expect(res).toBeDefined()
  })
})

describe('disabled DevTools proxy tracing', () => {
  it('keeps proxyTrace callable without retaining trace entries', () => {
    const event = {
      context: {
        odataConfig: {
          devtools: {
            enabled: false,
          },
        },
      },
    } as any

    const tracer = new DevToolsTracer(event)

    event.context.proxyTrace('Rules', 'Rule trace should be a no-op')
    tracer.addTrace('Proxy', 'Proxy trace should be a no-op')

    expect(tracer.enabled).toBe(false)
    expect(tracer.trace).toEqual([])
  })

  it('does not persist payload logs when DevTools are disabled', async () => {
    await clearODataLogs()
    const event = {
      method: 'POST',
      path: '/api/odx/TestService/Products',
      context: {
        odataConfig: {
          devtools: {
            enabled: false,
          },
        },
      },
    } as any
    const tracer = new DevToolsTracer(event)

    await tracer.initLog(
      event,
      'https://example.test/odata/Products',
      'TestService',
      'Products',
      { secret: 'request-payload' },
      { authorization: 'Bearer secret' },
    )
    await tracer.updateLog(200, { secret: 'response-payload' })

    expect(await getODataLogs()).toEqual([])
  })

  it('omits request and response bodies when payload logging policy is disabled', async () => {
    await clearODataLogs()
    const event = {
      method: 'POST',
      path: '/api/odx/TestService/Products',
      context: {
        odataConfig: {
          devtools: {
            enabled: true,
            logPayloads: false,
          },
        },
      },
      node: {
        res: {
          on: vi.fn(),
        },
      },
    } as any
    const tracer = new DevToolsTracer(event)

    await tracer.initLog(
      event,
      'https://example.test/odata/Products',
      'TestService',
      'Products',
      { secret: 'request-payload' },
      { 'authorization': 'Bearer secret', 'x-visible': 'visible' },
    )
    await tracer.updateLog(200, { secret: 'response-payload' })

    const [log] = await getODataLogs()
    expect(log).toMatchObject({
      service: 'TestService',
      status: 200,
      requestHeaders: {
        'authorization': '[Redacted]',
        'x-visible': 'visible',
      },
    })
    expect(log?.requestBody).toBeUndefined()
    expect(log?.responseBody).toBeUndefined()
  })

  it('uses isolated trace arrays for disabled tracer instances', () => {
    const createDisabledTracer = () => {
      const event = {
        context: {
          odataConfig: {
            devtools: {
              enabled: false,
            },
          },
        },
      } as any

      return new DevToolsTracer(event)
    }

    const firstTracer = createDisabledTracer()
    const secondTracer = createDisabledTracer()

    firstTracer.trace.push({ label: 'External mutation' })

    expect(firstTracer.trace).toHaveLength(1)
    expect(secondTracer.trace).toEqual([])
  })

  it('does not accumulate Nitro plugin trace entries when DevTools are disabled', async () => {
    const requestHooks: Array<(event: any) => Promise<void>> = []
    const nitro = {
      hooks: {
        hook(name: string, callback: (event: any) => Promise<void>) {
          if (name === 'request')
            requestHooks.push(callback)
        },
      },
    }

    btpAuthPlugin(nitro as any)
    useRuntimeConfigMock.mockReturnValue({
      odata: {
        basePath: '/api/odx',
        devtools: {
          enabled: false,
        },
        services: [
          {
            name: 'TestService',
            url: 'https://example.test/odata',
            strategy: 'proxied',
            proxyMode: 'buffer',
          },
        ],
      },
    })

    const event = {
      path: '/api/odx/TestService/Products',
      headers: new Headers(),
      context: {},
    } as any

    await requestHooks[0](event)

    expect(event.context.proxyTarget).toMatchObject({
      url: 'https://example.test/odata',
      isRelative: false,
    })
    expect(event.context.proxyTrace).toEqual([])
  })

  it('does not accumulate Nitro plugin trace entries in production', async () => {
    const originalNodeEnv = process.env.NODE_ENV
    const requestHooks: Array<(event: any) => Promise<void>> = []
    const nitro = {
      hooks: {
        hook(name: string, callback: (event: any) => Promise<void>) {
          if (name === 'request')
            requestHooks.push(callback)
        },
      },
    }

    btpAuthPlugin(nitro as any)
    useRuntimeConfigMock.mockReturnValue({
      odata: {
        basePath: '/api/odx',
        devtools: {
          enabled: true,
        },
        services: [
          {
            name: 'TestService',
            url: 'https://example.test/odata',
            strategy: 'proxied',
            proxyMode: 'buffer',
          },
        ],
      },
    })

    const event = {
      path: '/api/odx/TestService/Products',
      headers: new Headers(),
      context: {},
    } as any

    try {
      process.env.NODE_ENV = 'production'
      await requestHooks[0](event)
    }
    finally {
      process.env.NODE_ENV = originalNodeEnv
    }

    expect(event.context.proxyTarget).toMatchObject({
      url: 'https://example.test/odata',
      isRelative: false,
    })
    expect(event.context.proxyTrace).toEqual([])
  })
})
