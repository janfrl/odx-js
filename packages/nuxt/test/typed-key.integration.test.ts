import type { H3Event } from 'h3'
import type { AddressInfo } from 'node:net'
import { createServer } from 'node:http'
import { createODataTypedKey } from '@me-tools/odx-core'
import { expect, it } from 'vitest'
import { createODataServerMutationService, createODataServerReadService } from '../src/server'

it.each(['v2', 'v4'] as const)('preserves typed %s numeric identity across real reads and conditional writes', async (version) => {
  const requests: { url?: string, method?: string, etag?: string }[] = []
  const value = '9007199254740993.12345678901234567890'
  const server = createServer((request, response) => {
    requests.push({ url: request.url, method: request.method, etag: request.headers['if-match'] })
    response.writeHead(200, { 'Content-Type': 'application/json', 'ETag': 'W/"next"' })
    response.end(JSON.stringify({ ID: value, Name: 'Exact record' }))
  })
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolve)
  })
  try {
    const { port } = server.address() as AddressInfo
    const event = {
      context: { odataConfig: { basePath: '/api/odx', services: [{ name: 'catalog' }] } },
      fetch: (request: string, init: RequestInit) => fetch(new URL(request, `http://127.0.0.1:${port}`), init),
    } as unknown as H3Event
    const key = createODataTypedKey([{ field: 'ID', type: 'Edm.Decimal', value }], version)
    const read = createODataServerReadService(event, 'catalog').entitySet('Balances')
    const mutation = createODataServerMutationService(event, 'catalog').entitySet('Balances')
    expect(await read.fetchOne(key)).toMatchObject({ ID: value })
    const update = version === 'v2' ? mutation.merge : mutation.update
    await update(key, { Name: 'Updated' }, { headers: { 'If-Match': 'W/"current"' } })
    expect(requests).toEqual([
      { url: `/api/odx/catalog/Balances(${value}${version === 'v2' ? 'M' : ''})`, method: 'GET', etag: undefined },
      { url: `/api/odx/catalog/Balances(${value}${version === 'v2' ? 'M' : ''})`, method: version === 'v2' ? 'MERGE' : 'PATCH', etag: 'W/"current"' },
    ])
    await read.fetchOne(value)
    expect(requests[2]?.url).toBe(`/api/odx/catalog/Balances('${value}')`)
  }
  finally {
    server.closeAllConnections()
    await new Promise<void>((resolve, reject) => {
      server.close(error => error ? reject(error) : resolve())
    })
  }
})
