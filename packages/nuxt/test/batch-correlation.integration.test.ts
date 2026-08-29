import type { H3Event } from 'h3'
import type { AddressInfo } from 'node:net'
import { createServer } from 'node:http'
import { afterEach, expect, it } from 'vitest'
import { createODataServerMutationService } from '../src/server'
import { batchResponse } from './batch-response.fixture'

const servers: ReturnType<typeof createServer>[] = []
afterEach(async () => {
  for (const server of servers) {
    server.closeAllConnections()
    await new Promise<void>((resolve, reject) => {
      server.close(error => error ? reject(error) : resolve())
    })
  }
  servers.length = 0
})

it.each(['changeSet', 'v2ChangeSet'] as const)('%s correlates MIME identities across a real HTTP exchange without replay', async (method) => {
  const requests: { url?: string, method?: string, body: string }[] = []
  let groups = [['2', '1']]
  let status = 200
  const server = createServer(async (request, response) => {
    request.setEncoding('utf8')
    let body = ''
    for await (const chunk of request)
      body += chunk
    requests.push({ url: request.url, method: request.method, body })
    response.writeHead(200, { 'Content-Type': 'multipart/mixed; boundary=batch_response' })
    response.end(batchResponse(groups, status))
  })
  servers.push(server)
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolve)
  })
  const { port } = server.address() as AddressInfo
  const event = {
    context: {
      odataConfig: {
        basePath: '/api/odx',
        services: [{ name: 'catalog', route: 'catalog-api' }],
      },
    },
    fetch: (request: string, init: RequestInit) => fetch(new URL(request, `http://127.0.0.1:${port}`), init),
  } as unknown as H3Event
  const service = createODataServerMutationService(event, 'catalog')
  const mutations = [1, 2].map(key => ({
    kind: 'update' as const,
    entitySet: 'Products',
    key,
    body: { Active: true },
  }))

  const responses = await service[method](mutations)
  expect(responses.map(item => [item.contentId, item.body, item.headers.etag]))
    .toEqual([['1', { ID: '1' }, 'W/"1"'], ['2', { ID: '2' }, 'W/"2"']])
  groups = [['1', '1']]
  await expect(service[method](mutations)).rejects.toMatchObject({
    code: 'core.changeset.response-id-mismatch',
  })
  groups = [['1'], ['2']]
  await expect(service[method](mutations)).rejects.toMatchObject({
    code: 'core.changeset.response-count-mismatch',
  })
  groups = [['1', '2']]
  status = 202
  await expect(service[method](mutations)).rejects.toMatchObject({
    code: 'core.changeset.pending-response',
    responses: [{ status: 202 }, { status: 202 }],
  })
  expect(requests).toHaveLength(4)
  for (const request of requests) {
    expect(request.url).toBe('/api/odx/catalog-api/$batch')
    expect(request.method).toBe('POST')
    expect(request.body.match(/Content-ID: \d+/gu)).toEqual(['Content-ID: 1', 'Content-ID: 2'])
    expect(request.body).toContain(`${method === 'v2ChangeSet' ? 'MERGE' : 'PATCH'} Products(1) HTTP/1.1`)
  }
})
