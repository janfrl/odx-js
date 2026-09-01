import type { ODataProxyConfig, ODataServiceConfig } from '@me-tools/odx-core'
import type { H3Event } from 'h3'
import type { Server } from 'node:http'
import { Buffer } from 'node:buffer'
import { createServer } from 'node:http'
import { createApp, createRouter, defineEventHandler, toNodeListener } from 'h3'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createODataHandler } from '../src'
import odataHandler from '../src/api/odata'
import targetPlugin from '../src/plugins/btp-auth'
import { resolveBtpDestination } from '../src/utils/btp-destination'
import { resolveProxyTarget } from '../src/utils/target'
import { listenOnLoopback } from './fixtures/listen'

const runtime = vi.hoisted(() => ({ config: undefined as ODataProxyConfig | undefined }))
vi.mock('nitropack/runtime', () => ({
  defineNitroPlugin: (plugin: unknown) => plugin,
  useRuntimeConfig: () => ({ odata: runtime.config }),
}))
vi.mock('../src/utils/btp-destination', async importOriginal => ({
  ...await importOriginal<typeof import('../src/utils/btp-destination')>(),
  resolveBtpDestination: vi.fn(),
}))

interface DefaultsCase {
  name: string
  globalAuth?: ODataProxyConfig['auth']
  serviceAuth?: ODataServiceConfig['auth']
  serviceKey?: string
  strategy?: ODataServiceConfig['strategy']
  forwardAuthHeader?: boolean
  destination?: 'bearer' | 'none'
  expectedAuth?: string
}

const cases: DefaultsCase[] = [
  { name: 'global Bearer and headers', expectedAuth: 'Bearer global-token' },
  { name: 'service Bearer and case-insensitive header override', serviceAuth: { bearerToken: 'service-token' }, serviceKey: 'service-key', expectedAuth: 'Bearer service-token' },
  { name: 'service Basic instead of global Bearer', serviceAuth: { username: 'service-user', password: 'service-pass' }, expectedAuth: `Basic ${Buffer.from('service-user:service-pass').toString('base64')}` },
  { name: 'explicit empty service profile', serviceAuth: {} },
  { name: 'partial service profile without a borrowed global password', serviceAuth: { username: 'service-user' } },
  { name: 'global Basic', globalAuth: { username: 'global-user', password: 'global-pass' }, expectedAuth: `Basic ${Buffer.from('global-user:global-pass').toString('base64')}` },
  { name: 'explicit incoming authorization forwarding', serviceAuth: {}, forwardAuthHeader: true, expectedAuth: 'Bearer browser-token' },
  { name: 'computed global auth overrides incoming authorization', forwardAuthHeader: true, expectedAuth: 'Bearer global-token' },
  { name: 'direct bridge does not inherit global defaults or computed service auth', strategy: 'direct', serviceAuth: { bearerToken: 'service-token' } },
  { name: 'direct bridge retains explicitly enabled browser authorization', strategy: 'direct', forwardAuthHeader: true, expectedAuth: 'Bearer browser-token' },
  { name: 'Destination credentials retain precedence', destination: 'bearer', expectedAuth: 'Bearer destination-token' },
  { name: 'Destination without credentials does not borrow global auth', destination: 'none' },
]

const servers: Server[] = []
beforeEach(() => {
  vi.stubEnv('NODE_ENV', 'production')
  vi.stubEnv('VCAP_SERVICES', undefined)
  vi.mocked(resolveBtpDestination).mockReset()
})
afterEach(async () => {
  for (const server of servers.splice(0)) {
    await new Promise<void>((resolve) => {
      server.close(() => resolve())
      server.closeAllConnections()
    })
  }
  runtime.config = undefined
  vi.unstubAllEnvs()
})

describe.each(['standalone', 'nitro'] as const)('%s proxy global defaults', (entry) => {
  it('treats an uppercase HTTP scheme as an absolute configured backend', async () => {
    const config: ODataProxyConfig = {
      basePath: '/api/odx',
      buildDir: '.nuxt',
      rootDir: '.',
      mode: 'sdk',
      services: [{ name: 'Catalog', url: 'HTTPS://backend.example/odata' }],
    }
    const event = { path: '/api/odx/Catalog/Products', headers: new Headers(), context: {} } as unknown as H3Event

    if (entry === 'standalone') {
      expect(await resolveProxyTarget(event, config, 'Catalog')).toMatchObject({
        url: 'HTTPS://backend.example/odata',
        isRelative: false,
      })
    }
    else {
      runtime.config = config
      let requestHook: ((event: H3Event) => Promise<void>) | undefined
      await targetPlugin({
        hooks: {
          hook(_name: string, callback: typeof requestHook) {
            requestHook = callback
          },
        },
      } as any)
      await requestHook!(event)
      expect(event.context.proxyTarget).toMatchObject({
        url: 'HTTPS://backend.example/odata',
        isRelative: false,
      })
      expect(resolveBtpDestination).not.toHaveBeenCalled()
    }
  })

  it.each([
    { strategy: 'proxied', auth: undefined, destination: false, expected: 'Bearer global-token' },
    { strategy: 'proxied', auth: {}, destination: false, expected: '' },
    { strategy: 'direct', auth: undefined, destination: false, expected: '' },
    { strategy: 'direct', auth: { bearerToken: 'service-token' }, destination: false, expected: '' },
    { strategy: 'proxied', auth: undefined, destination: true, expected: '' },
  ] as const)('keeps relative/fallback credential boundaries: %j', async ({ strategy, auth, destination, expected }) => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.mocked(resolveBtpDestination).mockRejectedValue(new Error('Fixture Destination unavailable'))
    const config: ODataProxyConfig = {
      basePath: '/api/odx',
      buildDir: '.nuxt',
      rootDir: '.',
      mode: 'sdk',
      auth: { bearerToken: 'global-token' },
      services: [{ name: 'Catalog', strategy, auth, ...(destination ? { destination: 'FixtureDestination' } : {}) }],
    }
    const event = { path: '/api/odx/Catalog/Products', headers: new Headers(), context: {} } as unknown as H3Event
    if (entry === 'standalone') {
      expect(await resolveProxyTarget(event, config, 'Catalog')).toMatchObject({
        authHeader: expected,
        isRelative: true,
      })
    }
    else {
      runtime.config = config
      let requestHook: ((event: H3Event) => Promise<void>) | undefined
      await targetPlugin({
        hooks: {
          hook(_name: string, callback: typeof requestHook) {
            requestHook = callback
          },
        },
      } as any)
      await requestHook!(event)
      expect(event.context.proxyTarget).toMatchObject({ authHeader: expected, isRelative: true })
    }
  })

  describe.each(['buffer', 'stream'] as const)('%s transport', (proxyMode) => {
    it.each(cases)('$name', async (testCase) => {
      const received: Record<string, unknown>[] = []
      const backend = createServer((request, response) => {
        received.push({
          url: request.url,
          authorization: request.headers.authorization,
          key: request.headers['x-catalog-key'],
          tenant: request.headers['x-tenant'],
          priority: request.headers['x-priority'],
          note: request.headers['x-service-note'],
          cookie: request.headers.cookie,
          proxyAuthorization: request.headers['proxy-authorization'],
        })
        response.writeHead(request.headers.authorization === testCase.expectedAuth ? 200 : 403, {
          'content-type': 'application/json',
          'connection': 'close',
        })
        response.end(JSON.stringify({ value: [{ ID: 1 }] }))
      })
      servers.push(backend)
      const backendUrl = await listenOnLoopback(backend)
      vi.mocked(resolveBtpDestination).mockResolvedValue({
        name: 'FixtureDestination',
        url: backendUrl,
        ...(testCase.destination === 'bearer' ? { authTokens: [{ value: 'destination-token' }] } : {}),
      })
      const config: ODataProxyConfig = {
        basePath: '/api/odx',
        buildDir: '.nuxt',
        rootDir: '.',
        mode: 'sdk',
        forwardAuthHeader: testCase.forwardAuthHeader ?? false,
        auth: testCase.globalAuth ?? { bearerToken: 'global-token', password: 'global-pass' },
        headers: {
          'X-Catalog-Key': 'global-key',
          'X-Tenant': 'global-tenant',
          'X-Priority': 'global-priority',
          'Proxy-Authorization': 'private-proxy-default',
        },
        services: [{
          name: 'Catalog',
          ...(testCase.destination ? { destination: 'FixtureDestination' } : { url: backendUrl }),
          strategy: testCase.strategy ?? 'proxied',
          proxyMode,
          auth: testCase.serviceAuth,
          headers: {
            'x-service-note': 'explicit-service-note',
            'x-priority': 'service-priority',
            ...(testCase.serviceKey ? { 'x-catalog-key': testCase.serviceKey } : {}),
          },
        }],
      }
      runtime.config = config
      let requestHook: ((event: H3Event) => Promise<void>) | undefined
      if (entry === 'nitro') {
        await targetPlugin({
          hooks: {
            hook(_name: string, callback: typeof requestHook) {
              requestHook = callback
            },
          },
        } as any)
        expect(requestHook).toBeTypeOf('function')
      }
      const app = createApp()
      const router = createRouter()
      router.use('/api/odx/**', entry === 'standalone'
        ? createODataHandler(config)
        : defineEventHandler(async (event) => {
            await requestHook!(event)
            return odataHandler(event)
          }))
      app.use(router)
      const proxy = createServer(toNodeListener(app))
      servers.push(proxy)
      const proxyUrl = await listenOnLoopback(proxy)
      const response = await fetch(`${proxyUrl}/api/odx/Catalog/Products?$top=1`, {
        headers: {
          'authorization': 'Bearer browser-token',
          'cookie': 'browser-session=private',
          'x-priority': 'incoming-priority',
        },
      })
      await response.text()
      expect(response.status).toBe(200)
      expect(received).toEqual([{
        url: '/Products?$top=1',
        authorization: testCase.expectedAuth,
        key: testCase.strategy === 'direct' ? undefined : testCase.serviceKey ?? 'global-key',
        tenant: testCase.strategy === 'direct' ? undefined : 'global-tenant',
        priority: 'incoming-priority',
        note: 'explicit-service-note',
        cookie: undefined,
        proxyAuthorization: undefined,
      }])
      expect(resolveBtpDestination).toHaveBeenCalledTimes(testCase.destination ? 1 : 0)
    })
  })
})
