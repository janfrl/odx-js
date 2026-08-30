import type { H3Event } from 'h3'
import type { AddressInfo } from 'node:net'
import { Buffer } from 'node:buffer'
import { createServer } from 'node:http'
import { createODataTypedKey } from '@me-tools/odx-core'
import { expect, it } from 'vitest'
import { createODataServerMutationService, createODataServerReadService } from '../src/server'

it.each(['v2', 'v4'] as const)('preserves typed %s media identities, bytes, and validators over HTTP', async (version) => {
  const requests: { url?: string, method?: string, etag?: string, contentType?: string, body: string }[] = []
  const server = createServer(async (request, response) => {
    const chunks: Buffer[] = []
    for await (const chunk of request)
      chunks.push(Buffer.from(chunk))
    requests.push({ url: request.url, method: request.method, etag: request.headers['if-match'], contentType: request.headers['content-type'], body: Buffer.concat(chunks).toString() })
    if (request.method === 'GET') {
      response.writeHead(200, { 'Content-Type': 'text/plain', 'ETag': 'W/"stream"' })
      response.end('Exact stream')
    }
    else if (request.method === 'POST') {
      response.writeHead(201, { 'Content-Type': 'application/json', 'ETag': 'W/"created"' })
      response.end(JSON.stringify({ ID: '9223372036854775807' }))
    }
    else {
      response.writeHead(204, { ETag: 'W/"next"' })
      response.end()
    }
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
    const documents = createODataServerMutationService(event, 'catalog').entitySet('Documents')
    const value = '9007199254740993.12345678901234567890'
    const rootKey = createODataTypedKey([{ field: 'ID', type: 'Edm.Decimal', value }], version)
    const childKey = createODataTypedKey([{ field: 'ID', type: 'Edm.Int64', value: '9223372036854775807' }], version)
    const source = { kind: 'contained-entity' as const, rootKey, path: [{ navigationPath: ['Attachments'], key: childKey }] }
    const rootPath = `/api/odx/catalog/Documents(${value}${version === 'v2' ? 'M' : ''})`
    const path = `${rootPath}/Attachments(9223372036854775807${version === 'v2' ? 'L' : ''})`
    const stream = await documents.fetchMedia(rootKey)
    expect(new TextDecoder().decode(stream.data)).toBe('Exact stream')
    expect(stream.etag).toBe('W/"stream"')
    await documents.fetchMedia(source, { streamProperty: 'Content' })
    const body = new TextEncoder().encode('Replacement bytes')
    await expect(documents.updateMedia(source, body, { streamProperty: 'Content', contentType: 'text/plain', headers: { 'If-Match': 'W/"stream"' } })).resolves.toEqual({ etag: 'W/"next"' })
    await expect(documents.createNavigationMedia(source, ['Versions'], body, { contentType: 'text/plain', slug: 'exact.txt' })).resolves.toMatchObject({ data: { ID: '9223372036854775807' }, etag: 'W/"created"' })
    expect(requests.map(request => request.url)).toEqual([`${rootPath}/$value`, `${path}/Content/$value`, `${path}/Content/$value`, `${path}/Versions`])
    expect(requests[2]).toMatchObject({ method: 'PUT', etag: 'W/"stream"', contentType: 'text/plain', body: 'Replacement bytes' })
    expect(requests[3]).toMatchObject({ method: 'POST', contentType: 'text/plain', body: 'Replacement bytes' })
  }
  finally {
    server.closeAllConnections()
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
  }
})

it.each(['v2', 'v4'] as const)('preserves typed %s numeric identity across real reads and conditional writes', async (version) => {
  const requests: { url?: string, method?: string, etag?: string }[] = []
  const value = '9007199254740993.12345678901234567890'
  const server = createServer((request, response) => {
    requests.push({ url: request.url, method: request.method, etag: request.headers['if-match'] })
    response.writeHead(200, { 'Content-Type': 'application/json', 'ETag': 'W/"next"' })
    const record = { ID: value, Name: 'Exact record' }
    response.end(JSON.stringify(request.url?.includes('/Tags?')
      ? { 'value': [record], '@odata.count': 1 }
      : record))
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
    expect(read.supportsTypedEntityKeys).toBe(true)
    expect(mutation.supportsTypedEntityKeys).toBe(true)
    expect(await read.fetchOne(key)).toMatchObject({ ID: value })
    const update = version === 'v2' ? mutation.merge : mutation.update
    await update(key, { Name: 'Updated' }, { headers: { 'If-Match': 'W/"current"' } })
    expect(requests).toEqual([
      { url: `/api/odx/catalog/Balances(${value}${version === 'v2' ? 'M' : ''})`, method: 'GET', etag: undefined },
      { url: `/api/odx/catalog/Balances(${value}${version === 'v2' ? 'M' : ''})`, method: version === 'v2' ? 'MERGE' : 'PATCH', etag: 'W/"current"' },
    ])
    await read.fetchOne(value)
    expect(requests[2]?.url).toBe(`/api/odx/catalog/Balances('${value}')`)
    const child = createODataTypedKey([{ field: 'ID', type: 'Edm.Int64', value: '9223372036854775807' }], version)
    const source = { kind: 'contained-entity' as const, rootKey: key, path: [{ navigationPath: ['Items'], key: child }] }
    const containedPath = `/api/odx/catalog/Balances(${value}${version === 'v2' ? 'M' : ''})/Items(9223372036854775807${version === 'v2' ? 'L' : ''})`
    expect(await read.fetchContainedOneWithResponse(source)).toMatchObject({ data: { ID: value }, etag: 'W/"next"' })
    expect(await read.fetchNavigationOneWithResponse({ source, navigationPath: ['Supplier'] })).toMatchObject({ data: { ID: value }, etag: 'W/"next"' })
    expect(requests.slice(3)).toEqual([
      { url: containedPath, method: 'GET', etag: undefined },
      { url: `${containedPath}/Supplier`, method: 'GET', etag: undefined },
    ])
    if (version === 'v4') {
      const activeKey = createODataTypedKey([
        { field: 'ID', type: 'Edm.Decimal', value },
        { field: 'IsActiveEntity', type: 'Edm.Boolean', value: true },
      ], version)
      const draftKey = createODataTypedKey([
        { field: 'ID', type: 'Edm.Decimal', value },
        { field: 'IsActiveEntity', type: 'Edm.Boolean', value: false },
      ], version)
      await mutation.invoke('Demo.draftEdit', { key: activeKey, parameters: {} }, { headers: { 'If-Match': 'W/"active"' } })
      await mutation.remove(draftKey, { headers: { 'If-Match': 'W/"draft"' } })
      expect(requests.slice(5)).toEqual([
        { url: `/api/odx/catalog/Balances(ID=${value},IsActiveEntity=true)/Demo.draftEdit`, method: 'POST', etag: 'W/"active"' },
        { url: `/api/odx/catalog/Balances(ID=${value},IsActiveEntity=false)`, method: 'DELETE', etag: 'W/"draft"' },
      ])
      await read.invokeFunction('Demo.GetDefaults', {
        key: draftKey,
        navigationPath: ['Items'],
        parameters: { Kind: { type: 'Edm.String', value: 'Office' } },
      })
      expect(decodeURIComponent(requests[7]!.url!)).toBe(`/api/odx/catalog/Balances(ID=${value},IsActiveEntity=false)/Items/Demo.GetDefaults(Kind='Office')`)
      expect(requests[7]!.method).toBe('GET')
    }
    const tags = await read.fetchNavigationList(source, ['Tags'], { $select: 'ID', $top: 101 })
    expect([...tags]).toEqual([
      { ID: value, Name: 'Exact record' },
    ])
    expect(tags).toHaveProperty('totalCount', 1)
    expect(decodeURIComponent(requests.at(-1)!.url!)).toBe(`${containedPath}/Tags?$select=ID&$top=101`)
  }
  finally {
    server.closeAllConnections()
    await new Promise<void>((resolve, reject) => {
      server.close(error => error ? reject(error) : resolve())
    })
  }
})
