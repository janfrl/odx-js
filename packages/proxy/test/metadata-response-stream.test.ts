import type { ODataProxyConfig, ODataServiceConfig } from '@me-tools/odx-core'
import type { H3Event } from 'h3'
import type { ClientRequest, IncomingMessage } from 'node:http'
import { Buffer } from 'node:buffer'
import { EventEmitter } from 'node:events'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import http from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { refreshRuntimeMetadata } from '../src/utils/metadata-refresh'
import { resolveProxyTarget } from '../src/utils/target'

vi.mock('../src/utils/target', async importOriginal => ({
  ...await importOriginal<typeof import('../src/utils/target')>(),
  resolveProxyTarget: vi.fn(),
}))

const roots: string[] = []

afterEach(() => {
  vi.restoreAllMocks()
  vi.mocked(resolveProxyTarget).mockReset()
  for (const root of roots)
    rmSync(root, { recursive: true, force: true })
  roots.length = 0
})

async function startRefresh(statusCode = 200) {
  const rootDir = mkdtempSync(join(tmpdir(), 'odx-metadata-stream-'))
  roots.push(rootDir)
  const service: ODataServiceConfig = { name: 'Catalog', url: 'http://example.test/odata', strategy: 'proxied' }
  const config: ODataProxyConfig = { rootDir, buildDir: join(rootDir, '.nuxt'), basePath: '/api/odx', mode: 'sdk', services: [service] }
  vi.mocked(resolveProxyTarget).mockResolvedValue({ url: service.url!, authHeader: '', isRelative: false, strategy: 'proxied' })
  const response = Object.assign(new EventEmitter(), { statusCode, complete: false, resume: vi.fn() })
  const request = Object.assign(new EventEmitter(), { setTimeout: vi.fn(), destroy: vi.fn() })
  let markRequested!: () => void
  const requested = new Promise<void>((resolve) => {
    markRequested = resolve
  })
  vi.spyOn(http, 'get').mockImplementation((_url, _options, callback) => {
    callback!(response as unknown as IncomingMessage)
    markRequested()
    return request as unknown as ClientRequest
  })
  const event = { headers: new Headers(), node: { req: { headers: {} } } } as unknown as H3Event
  const result = refreshRuntimeMetadata(event, config, service)
    .then(value => ({ state: 'resolved', value }), error => ({ state: 'rejected', error }))
  await requested
  return { response, result, rootDir }
}

describe('runtime metadata response streams', () => {
  it.each(['Größe', 'Preis €', '商品', 'Delivery 🚚'])('preserves a byte-split UTF-8 label: %s', async (label) => {
    const { response, result, rootDir } = await startRefresh()
    const xml = `<edmx:Edmx xmlns:edmx="http://docs.oasis-open.org/odata/ns/edmx" Version="4.0"><edmx:DataServices><Schema xmlns="http://docs.oasis-open.org/odata/ns/edm" Namespace="Catalog"><Annotation Term="com.sap.vocabularies.Common.v1.Label" String="${label}"/></Schema></edmx:DataServices></edmx:Edmx>`
    const bytes = Buffer.from(xml, 'utf8')
    for (let index = 0; index < bytes.length; index++)
      response.emit('data', bytes.subarray(index, index + 1))
    response.complete = true
    response.emit('end')
    response.emit('close')
    expect(await result).toMatchObject({ state: 'resolved', value: { stale: false, source: 'remote', bytes: bytes.length } })
    expect(readFileSync(join(rootDir, '.odx', 'cache', 'Catalog.edmx'), 'utf8')).toBe(xml)
  })

  it.each(['aborted', 'close'])('rejects an incomplete response on %s without waiting for end', async (event) => {
    const { response, result } = await startRefresh()
    response.emit('data', '<edmx:Edmx>')
    response.emit(event)
    expect(await Promise.race([
      result,
      new Promise(resolve => setImmediate(() => resolve({ state: 'pending' }))),
    ])).toMatchObject({ state: 'rejected', error: { message: 'Metadata response ended before completion' } })
  })

  it('handles response errors without an unhandled stream exception', async () => {
    const { response, result } = await startRefresh()
    const failure = new Error('Response stream failed')
    expect(() => response.emit('error', failure)).not.toThrow()
    expect(await result).toEqual({ state: 'rejected', error: failure })
  })

  it('consumes a later response error after rejecting an HTTP status', async () => {
    const { response, result } = await startRefresh(503)
    expect(() => response.emit('error', new Error('Response failed during drain'))).not.toThrow()
    expect(await result).toMatchObject({ state: 'rejected', error: { message: 'Status: 503' } })
    expect(response.resume).toHaveBeenCalledOnce()
  })
})
