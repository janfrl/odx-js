import type { H3Event } from 'h3'
import type { AddressInfo } from 'node:net'
import { createServer } from 'node:http'
import { expect, it } from 'vitest'
import { createODataServerReadService } from '../src/server'

it('rejects invalid V4 integer arguments before HTTP and preserves exact bound function literals', async () => {
  const requests: { url?: string, method?: string }[] = []
  const server = createServer((request, response) => {
    requests.push({ url: request.url, method: request.method })
    response.writeHead(200, { 'Content-Type': 'application/json' })
    response.end(JSON.stringify({ path: request.url }))
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
    const service = createODataServerReadService(event, 'catalog')
    const products = service.entitySet('Products')
    for (const [type, value] of [
      ['Edm.Byte', 256],
      ['Edm.SByte', -129],
      ['Edm.Int16', '32768'],
      ['Edm.Int32', '2147483648'],
      ['Edm.Int64', '9223372036854775808'],
      ['Edm.Int64', '1.5'],
      ['Edm.Int64', Number.MAX_SAFE_INTEGER + 1],
    ] as const) {
      const parameters = { Count: { type, value } }
      expect(() => service.invokeFunction('Demo.Defaults', { parameters })).toThrow('invalid value')
      expect(() => products.invokeFunction('Demo.Defaults', { parameters })).toThrow('invalid value')
      expect(() => products.invokeFunction('Demo.Defaults', { key: 1, parameters })).toThrow('invalid value')
      expect(() => products.invokeFunction('Demo.Defaults', { key: 1, navigationPath: ['Items'], parameters })).toThrow('invalid value')
    }
    expect(requests).toEqual([])
    const parameters = {
      Count: { type: 'Edm.Int64', value: '9223372036854775807' },
      Minimum: { type: 'Edm.Int64', value: '-9223372036854775808' },
      Byte: { type: 'Edm.Byte', value: 255 },
      Optional: { type: 'Edm.Int64', value: null },
    }
    const call = 'Demo.Defaults(Count=9223372036854775807,Minimum=-9223372036854775808,Byte=255,Optional=null)'
    await expect(service.invokeFunction('Demo.Defaults', { parameters })).resolves.toEqual({ path: `/api/odx/catalog/${call}` })
    await products.invokeFunction('Demo.Defaults', { parameters })
    await products.invokeFunction('Demo.Defaults', { key: 1, parameters })
    await products.invokeFunction('Demo.Defaults', { key: 1, navigationPath: ['Items'], parameters })
    expect(requests).toEqual([
      { method: 'GET', url: `/api/odx/catalog/${call}` },
      { method: 'GET', url: `/api/odx/catalog/Products/${call}` },
      { method: 'GET', url: `/api/odx/catalog/Products(1)/${call}` },
      { method: 'GET', url: `/api/odx/catalog/Products(1)/Items/${call}` },
    ])
  }
  finally {
    server.closeAllConnections()
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
  }
})
