import type { ODataProxyConfig } from '@me-tools/odx-core'
import { createServer } from 'node:http'
import { connect } from 'node:net'
import process from 'node:process'
import { toNodeListener } from 'h3'
import { ofetch } from 'ofetch'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { resolveBtpDestination } from '../src/utils/btp-destination'
import { createBackend } from './fixtures/backend'
import { listenOnLoopback } from './fixtures/listen'
import { createProxyServer } from './fixtures/server'

vi.mock('../src/utils/btp-destination', async importOriginal => ({
  ...await importOriginal<typeof import('../src/utils/btp-destination')>(),
  resolveBtpDestination: vi.fn(),
}))

describe('connectivity host interaction', () => {
  const originalNodeEnv = process.env.NODE_ENV
  const tunneledTraffic: string[] = []
  const proxyAuthorization: Array<string | undefined> = []
  const backend = createServer(toNodeListener(createBackend()))
  const connectivityProxy = createServer()
  const odxProxy = createServer()
  let odxUrl = ''

  beforeAll(async () => {
    process.env.NODE_ENV = 'production'
    const backendUrl = new URL(await listenOnLoopback(backend))
    connectivityProxy.on('connect', (request, clientSocket, head) => {
      proxyAuthorization.push(request.headers['proxy-authorization'])
      const backendSocket = connect(Number(backendUrl.port), backendUrl.hostname, () => {
        clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n')
        if (head.length > 0)
          backendSocket.write(head)
        clientSocket.on('data', data => tunneledTraffic.push(data.toString('utf8')))
        clientSocket.pipe(backendSocket)
        backendSocket.pipe(clientSocket)
      })
      backendSocket.on('error', () => clientSocket.destroy())
    })
    const connectivityUrl = new URL(await listenOnLoopback(connectivityProxy))
    vi.mocked(resolveBtpDestination).mockResolvedValue({
      name: 'S4_ONPREMISE',
      url: 'http://virtual-onpremise.internal:8000',
      authTokens: [{ value: 'destination-token' }],
      authentication: 'PrincipalPropagation',
      proxyType: 'OnPremise',
      connectivity: {
        host: connectivityUrl.hostname,
        port: Number(connectivityUrl.port),
        token: 'connectivity-token',
        userToken: 'app-router-user-token',
      },
    })
    const config: ODataProxyConfig = {
      basePath: '/api/odx',
      mode: 'sdk',
      services: [
        {
          name: 'OnPremiseBuffer',
          destination: 'S4_ONPREMISE',
          strategy: 'proxied',
          proxyMode: 'buffer',
          csrf: { mode: 'sap' },
        },
        {
          name: 'OnPremiseStream',
          destination: 'S4_ONPREMISE',
          strategy: 'proxied',
          proxyMode: 'stream',
          csrf: { mode: 'sap', fetchMethod: 'GET' },
        },
      ],
      buildDir: '.nuxt',
      rootDir: process.cwd(),
    }
    odxProxy.on('request', toNodeListener(createProxyServer(config)))
    odxUrl = await listenOnLoopback(odxProxy)
  })

  afterAll(async () => {
    process.env.NODE_ENV = originalNodeEnv
    for (const server of [odxProxy, connectivityProxy, backend]) {
      server.closeAllConnections()
      await new Promise<void>(resolve => server.close(() => resolve()))
    }
  })

  it.each([
    ['OnPremiseBuffer', 'HEAD'],
    ['OnPremiseStream', 'GET'],
  ])('completes routed CSRF and session interaction through %s', async (serviceName, preflightMethod) => {
    const response = await ofetch.raw(`${odxUrl}/api/odx/${serviceName}/CsrfProducts`, {
      method: 'PATCH',
      headers: {
        'Authorization': 'Bearer app-router-user-token',
        'If-Match': 'W/"1"',
        'SAP-Connectivity-Authentication': 'Bearer attacker-controlled',
      },
      body: { Name: `${serviceName} Desk` },
    })

    expect(response.status).toBe(200)
    expect(response.headers.get('set-cookie')).toBeNull()
    expect(response._data.d).toMatchObject({
      Name: `${serviceName} Desk`,
      csrfValidated: true,
      sessionValidated: true,
      preflightMethod,
      ifMatch: 'W/"1"',
    })
  })

  it('keeps platform and backend credentials on their owning hops', () => {
    expect(resolveBtpDestination).toHaveBeenCalledTimes(2)
    expect(resolveBtpDestination).toHaveBeenNthCalledWith(1, 'S4_ONPREMISE', 'Bearer app-router-user-token', {
      allowMissingBindingFallback: false,
      allowResolutionFailureFallback: false,
    })
    expect(proxyAuthorization).not.toHaveLength(0)
    expect(proxyAuthorization).toEqual(expect.arrayContaining(['Bearer connectivity-token']))

    const traffic = tunneledTraffic.join('')
    expect(traffic).toContain('authorization: Bearer destination-token')
    expect(traffic).toContain('sap-connectivity-authentication: Bearer app-router-user-token')
    expect(traffic).toContain('x-csrf-token: Fetch')
    expect(traffic).toContain('SAP_SESSIONID=fresh')
    expect(traffic).not.toContain('attacker-controlled')
    expect(traffic).not.toContain('Proxy-Authorization')
  })
})
