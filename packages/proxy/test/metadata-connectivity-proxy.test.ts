import type { ODataProxyConfig, ODataServiceConfig } from '@me-tools/odx-core'
import type { H3Event } from 'h3'
import type { AddressInfo } from 'node:net'
import { Buffer } from 'node:buffer'
import { mkdtempSync, rmSync } from 'node:fs'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { refreshRuntimeMetadata } from '../src/utils/metadata-refresh'
import { resolveProxyTarget } from '../src/utils/target'

vi.mock('../src/utils/target', async importOriginal => ({
  ...await importOriginal<typeof import('../src/utils/target')>(),
  resolveProxyTarget: vi.fn(),
}))

const metadataXml = '<?xml version="1.0"?><edmx:Edmx Version="4.0" xmlns:edmx="http://docs.oasis-open.org/odata/ns/edmx"><edmx:DataServices /></edmx:Edmx>'

describe('metadata refresh through Connectivity proxy', () => {
  const roots: string[] = []
  const servers: ReturnType<typeof createServer>[] = []

  afterEach(async () => {
    vi.resetAllMocks()
    await Promise.all(servers.map(server => new Promise<void>((resolve, reject) => {
      server.close(error => error ? reject(error) : resolve())
    })))
    servers.length = 0
    for (const root of roots)
      rmSync(root, { recursive: true, force: true })
    roots.length = 0
  })

  it('uses the resolved dispatcher and principal propagation header', async () => {
    let tunneledRequest = ''
    const proxy = createServer()
    proxy.on('connect', (request, clientSocket) => {
      expect(request.url).toBe('virtual-metadata.internal:8000')
      expect(request.headers['proxy-authorization']).toBe('Bearer connectivity-token')
      clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n')
      clientSocket.once('data', (data) => {
        tunneledRequest = data.toString('utf8')
        clientSocket.end([
          'HTTP/1.1 200 OK',
          'Content-Type: application/xml',
          `Content-Length: ${Buffer.byteLength(metadataXml)}`,
          'Connection: close',
          '',
          metadataXml,
        ].join('\r\n'))
      })
    })
    servers.push(proxy)
    await new Promise<void>((resolve, reject) => {
      proxy.once('error', reject)
      proxy.listen(0, '127.0.0.1', resolve)
    })
    const address = proxy.address() as AddressInfo
    vi.mocked(resolveProxyTarget).mockResolvedValue({
      url: 'http://virtual-metadata.internal:8000/sap/opu/odata/sap/METADATA',
      authHeader: 'Bearer destination-token',
      isRelative: false,
      strategy: 'proxied',
      connectivity: {
        host: address.address,
        port: address.port,
        token: 'connectivity-token',
        userToken: 'user-token',
      },
    })
    const rootDir = mkdtempSync(join(tmpdir(), 'odx-connectivity-metadata-'))
    roots.push(rootDir)
    const service = {
      name: 'MetadataService',
      destination: 'METADATA',
      strategy: 'proxied',
    } as ODataServiceConfig
    const config = {
      rootDir,
      buildDir: join(rootDir, '.nuxt'),
      basePath: '/api/odx',
      mode: 'sdk',
      services: [service],
    } as ODataProxyConfig

    const event = {
      headers: new Headers(),
      node: { req: { headers: {} } },
    } as unknown as H3Event
    const result = await refreshRuntimeMetadata(event, config, service)

    expect(result).toMatchObject({ source: 'remote', stale: false })
    expect(tunneledRequest).toContain('GET /sap/opu/odata/sap/METADATA/$metadata HTTP/1.1')
    expect(tunneledRequest).toMatch(/\r\nauthorization: Bearer destination-token\r\n/i)
    expect(tunneledRequest).toMatch(/\r\nsap-connectivity-authentication: Bearer user-token\r\n/i)
  })
})
