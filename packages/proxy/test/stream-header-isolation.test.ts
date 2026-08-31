import type { ODataProxyConfig } from '@me-tools/odx-core'
import type { Server } from 'node:http'
import { createServer, request } from 'node:http'
import { toNodeListener } from 'h3'
import { afterEach, describe, expect, it } from 'vitest'
import { listenOnLoopback } from './fixtures/listen'
import { createProxyServer } from './fixtures/server'

const servers: Server[] = []
afterEach(async () => {
  for (const server of servers.splice(0)) {
    await new Promise<void>((resolve) => {
      server.close(() => resolve())
      server.closeAllConnections()
    })
  }
})

describe.each(['buffer', 'stream'] as const)('%s backend header isolation', (proxyMode) => {
  it.each([
    { forward: false, managed: false, backendCookie: false },
    { forward: true, managed: false, backendCookie: false },
    { forward: false, managed: true, backendCookie: true },
    { forward: false, managed: false, backendCookie: true },
  ])('keeps only allowed headers: %j', async ({ forward, managed, backendCookie }) => {
    const received: Record<string, unknown>[] = []
    const backend = createServer((incoming, response) => {
      received.push({
        authorization: incoming.headers.authorization,
        cookie: incoming.headers.cookie,
        setCookie: incoming.headers['set-cookie'],
        forwarded: incoming.headers.forwarded,
        forwardedHost: incoming.headers['x-forwarded-host'],
        realIp: incoming.headers['x-real-ip'],
        via: incoming.headers.via,
        proxyAuthorization: incoming.headers['proxy-authorization'],
        connectivityAuthentication: incoming.headers['sap-connectivity-authentication'],
        hopSecret: incoming.headers['x-hop-secret'],
        requestId: incoming.headers['x-request-id'],
      })
      response.writeHead(200, {
        'content-type': 'application/json',
        'etag': 'W/"fixture-1"',
        'set-cookie': 'backend-response-session=private',
      })
      response.end(JSON.stringify({ value: [{ ID: 1 }] }))
    })
    servers.push(backend)
    const backendUrl = await listenOnLoopback(backend)
    const config: ODataProxyConfig = {
      basePath: '/api/odx',
      buildDir: '.nuxt',
      rootDir: '.',
      mode: 'sdk',
      forwardAuthHeader: forward,
      services: [{
        name: 'Catalog',
        url: backendUrl,
        proxyMode,
        ...(managed ? { auth: { bearerToken: 'managed-backend-token' } } : {}),
        ...(backendCookie ? { headers: { cookie: 'explicit-backend-session=value' } } : {}),
      }],
    }
    const proxy = createServer(toNodeListener(createProxyServer(config)))
    servers.push(proxy)
    const proxyUrl = await listenOnLoopback(proxy)
    // Native HTTP permits hop-by-hop names that fetch rejects before dispatch.
    const result = await new Promise<{ status: number, cookie?: string[], etag?: string }>((resolve, reject) => {
      const outgoing = request(`${proxyUrl}/api/odx/Catalog/Products`, {
        headers: {
          'authorization': 'Bearer browser-token',
          'cookie': 'browser-session=private',
          'set-cookie': 'injected-response-session=private',
          'forwarded': 'for=192.0.2.1',
          'x-forwarded-host': 'untrusted.example.test',
          'x-real-ip': '192.0.2.1',
          'via': '1.1 untrusted-proxy',
          'proxy-authorization': 'Bearer browser-proxy-token',
          'sap-connectivity-authentication': 'Bearer browser-connectivity-token',
          'connection': 'close, x-hop-secret',
          'x-hop-secret': 'hop-only-secret',
          'x-request-id': 'request-fixture',
        },
      }, (response) => {
        response.on('error', reject)
        response.resume()
        response.on('end', () => resolve({
          status: response.statusCode ?? 0,
          cookie: response.headers['set-cookie'],
          etag: response.headers.etag,
        }))
      })
      outgoing.on('error', reject)
      outgoing.end()
    })

    expect(result).toEqual({ status: 200, cookie: undefined, etag: 'W/"fixture-1"' })
    expect(received).toEqual([{
      authorization: managed ? 'Bearer managed-backend-token' : forward ? 'Bearer browser-token' : undefined,
      cookie: backendCookie ? 'explicit-backend-session=value' : undefined,
      setCookie: undefined,
      forwarded: undefined,
      forwardedHost: undefined,
      realIp: undefined,
      via: undefined,
      proxyAuthorization: undefined,
      connectivityAuthentication: undefined,
      hopSecret: undefined,
      requestId: 'request-fixture',
    }])
  })
})
