import type { AddressInfo } from 'node:net'
import { Buffer } from 'node:buffer'
import { createServer } from 'node:http'
import { afterEach, describe, expect, it } from 'vitest'
import { resolveConnectivityRequest } from '../src/utils/connectivity-proxy'

describe('connectivity proxy transport', () => {
  const servers: ReturnType<typeof createServer>[] = []

  afterEach(async () => {
    await Promise.all(servers.map(server => new Promise<void>((resolve, reject) => {
      server.close(error => error ? reject(error) : resolve())
    })))
    servers.length = 0
  })

  it('routes a virtual OnPremise URL through the authenticated HTTP proxy', async () => {
    let proxyRequest: { url?: string, targetPath?: string, proxyAuthorization?: string, principalPropagation?: string } | undefined
    const proxy = createServer()
    proxy.on('connect', (request, clientSocket) => {
      proxyRequest = {
        url: request.url,
        proxyAuthorization: request.headers['proxy-authorization'],
      }
      clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n')
      clientSocket.once('data', (data) => {
        const tunneledRequest = data.toString('utf8')
        proxyRequest!.targetPath = tunneledRequest.match(/^\S+\s+(\S+)/)?.[1]
        proxyRequest!.principalPropagation = tunneledRequest.match(/\r\nsap-connectivity-authentication:\s*([^\r\n]+)/i)?.[1]
        const body = '{"value":"routed"}'
        clientSocket.end([
          'HTTP/1.1 200 OK',
          'Content-Type: application/json',
          `Content-Length: ${Buffer.byteLength(body)}`,
          'Connection: close',
          '',
          body,
        ].join('\r\n'))
      })
    })
    servers.push(proxy)
    await new Promise<void>((resolve, reject) => {
      proxy.once('error', reject)
      proxy.listen(0, '127.0.0.1', resolve)
    })
    const address = proxy.address() as AddressInfo
    const connectivity = await resolveConnectivityRequest({
      host: address.address,
      port: address.port,
      token: 'connectivity-token',
      userToken: 'user-token',
    })

    const response = await connectivity.fetch!('http://virtual-onpremise.internal:8000/sap/opu/odata/Products', {
      dispatcher: connectivity.dispatcher,
      headers: connectivity.headers,
    } as RequestInit)

    await expect(response.json()).resolves.toEqual({ value: 'routed' })
    expect(proxyRequest).toEqual({
      url: 'virtual-onpremise.internal:8000',
      targetPath: '/sap/opu/odata/Products',
      proxyAuthorization: 'Bearer connectivity-token',
      principalPropagation: 'Bearer user-token',
    })
  })
})
