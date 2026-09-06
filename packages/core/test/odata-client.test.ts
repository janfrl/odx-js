import { createServer } from 'node:http'
import { afterAll, beforeAll, describe, expect, expectTypeOf, it, vi } from 'vitest'
import { createODataClient } from '../src/odata-client'

function createClient(basePath: string) {
  return createODataClient({ config: { basePath, services: [], buildDir: '', rootDir: '', mode: 'test' } })
}

describe('odata client response ownership', () => {
  const sensitiveBody = { error: { code: 'STALE_ETAG', message: 'private business value', token: 'fixture-token' } }
  const server = createServer((request, response) => {
    const empty = request.url === '/empty'
    response.writeHead(request.url === '/success' ? 200 : 412, {
      'content-type': 'application/json',
      'etag': 'W/"next"',
      'x-private-context': 'fixture-private-context',
    })
    response.end(empty ? undefined : JSON.stringify(request.url === '/success' ? { ID: 1 } : sensitiveBody))
  })
  let basePath: string

  beforeAll(async () => {
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
    const address = server.address()
    if (!address || typeof address === 'string')
      throw new Error('Expected a local HTTP server address.')
    basePath = `http://127.0.0.1:${address.port}`
  })

  afterAll(async () => {
    server.closeAllConnections()
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
  })

  it.each(['/conflict', '/empty'])('does not log a failed backend response from %s', async (path) => {
    const logger = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      const client = createClient(basePath)
      await expect(client(path, { retry: 0 })).rejects.toMatchObject({
        status: 412,
        ...(path === '/conflict' ? { data: sensitiveBody } : {}),
      })
      expect(logger).not.toHaveBeenCalled()
    }
    finally {
      logger.mockRestore()
    }
  })

  it('retains explicit host response-error handling', async () => {
    const hostError = vi.fn()
    const client = createClient(basePath)
    await expect(client('/conflict', { retry: 0, onResponseError: hostError })).rejects.toMatchObject({ status: 412 })
    expect(hostError).toHaveBeenCalledOnce()
    expect(hostError.mock.calls[0]?.[0].response._data).toEqual(sensitiveBody)
  })

  it('retains parsed and raw success contracts', async () => {
    const client = createClient(basePath)
    expectTypeOf(client).not.toBeAny()
    const result = client<{ ID: number }>('/success')
    expectTypeOf(result).toEqualTypeOf<Promise<{ ID: number }>>()
    await expect(result).resolves.toEqual({ ID: 1 })
    const response = await client.raw<{ ID: number }>('/success')
    expectTypeOf(response._data).toEqualTypeOf<{ ID: number } | undefined>()
    expect(response._data).toEqual({ ID: 1 })
    expect(response.headers.get('etag')).toBe('W/"next"')
  })
})
