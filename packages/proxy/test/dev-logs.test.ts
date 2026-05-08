import {
  addODataLog,
  boundLogPayload,
  clearODataLogs,
  getODataLog,
  getODataLogs,
  OdxMemoryLogStore,
  redactSensitiveHeaders,
  updateODataLog,
} from '@bc8-odx/core'
import { beforeEach, describe, expect, it } from 'vitest'

describe('proxy Dev Logs', () => {
  beforeEach(() => {
    clearODataLogs()
  })

  it('stores and retrieves logs', async () => {
    await addODataLog({
      id: '1',
      timestamp: Date.now(),
      method: 'GET',
      url: '/test',
      service: 'TestService',
    })

    const logs = await getODataLogs()
    expect(logs).toHaveLength(1)
    expect(logs[0]?.id).toBe('1')
  })

  it('protects stored logs from returned array and object mutation', async () => {
    await addODataLog({
      id: '1',
      timestamp: 1,
      method: 'GET',
      url: '/test',
      service: 'TestService',
    })

    const logs = await getODataLogs()
    logs.push({
      id: 'external',
      timestamp: 2,
      method: 'POST',
      url: '/external',
      service: 'ExternalService',
    })
    logs[0]!.requestHeaders = { authorization: 'mutated' }

    const stored = await getODataLogs()
    expect(stored).toHaveLength(1)
    expect(stored[0]?.id).toBe('1')
    expect(stored[0]?.requestHeaders).toBeUndefined()
  })

  it('respects maximum log limit', async () => {
    for (let i = 0; i < 110; i++) {
      await addODataLog({ id: String(i), timestamp: i, method: 'GET', url: '/t', service: 'S' })
    }
    expect(await getODataLogs()).toHaveLength(100)
  })

  it('updates and gets logs through the store boundary', async () => {
    await addODataLog({
      id: 'update-me',
      timestamp: 1,
      method: 'POST',
      url: '/test',
      service: 'TestService',
      isPending: true,
    })

    await updateODataLog('update-me', {
      status: 201,
      isPending: false,
      responseBody: { ok: true },
    })

    expect(await getODataLog('update-me')).toMatchObject({
      id: 'update-me',
      status: 201,
      isPending: false,
      responseBody: { ok: true },
    })
  })

  it('supports retention-friendly list and clear options', () => {
    const store = new OdxMemoryLogStore()
    store.append({ id: 'old-a', timestamp: 10, method: 'GET', url: '/a', service: 'A', status: 200 })
    store.append({ id: 'new-a', timestamp: 20, method: 'POST', url: '/a', service: 'A', status: 500 })
    store.append({ id: 'old-b', timestamp: 5, method: 'GET', url: '/b', service: 'B', isPending: true })

    expect(store.list({ service: 'A', status: 'failure' }).map(log => log.id)).toEqual(['new-a'])
    expect(store.list({ before: 20, order: 'asc' }).map(log => log.id)).toEqual(['old-b', 'old-a'])
    expect(store.list({ limit: 1 }).map(log => log.id)).toEqual(['new-a'])

    store.clear({ before: 15 })

    expect(store.list().map(log => log.id)).toEqual(['new-a'])
  })

  it('redacts sensitive request headers before storage', async () => {
    await addODataLog({
      id: 'headers',
      timestamp: 1,
      method: 'GET',
      url: '/test',
      service: 'TestService',
      requestHeaders: {
        'authorization': 'Bearer secret',
        'cookie': 'sid=secret',
        'set-cookie': 'sid=secret',
        'x-api-key': 'api-secret',
        'x-csrf-token': 'csrf-secret',
        'x-sap-security-session': 'sap-secret',
        'x-visible': 'visible',
      },
    })

    const [log] = await getODataLogs()
    expect(log?.requestHeaders).toEqual({
      'authorization': '[Redacted]',
      'cookie': '[Redacted]',
      'set-cookie': '[Redacted]',
      'x-api-key': '[Redacted]',
      'x-csrf-token': '[Redacted]',
      'x-sap-security-session': '[Redacted]',
      'x-visible': 'visible',
    })
    expect(redactSensitiveHeaders({ 'x-session-token': 'secret' })['x-session-token']).toBe('[Redacted]')
  })

  it('redacts sensitive proxy trace header details before storage', async () => {
    await addODataLog({
      id: 'trace-headers',
      timestamp: 1,
      method: 'GET',
      url: '/test',
      service: 'TestService',
      proxyTrace: [
        {
          timestamp: 1,
          duration: 0,
          label: 'Rules',
          message: 'Injecting custom header: "x-api-key"',
          status: 'info',
          details: {
            name: 'x-api-key',
            value: 'api-secret',
            policy: 'HeaderInjection',
          },
        },
        {
          timestamp: 2,
          duration: 1,
          label: 'Rules',
          message: 'Checking header policy: "x-csrf-token"',
          status: 'info',
          details: {
            header: 'x-csrf-token',
            actual: 'csrf-secret',
            deniedValue: 'csrf-secret',
            policy: 'HeaderGuard',
          },
        },
        {
          timestamp: 3,
          duration: 2,
          label: 'Rules',
          message: 'Nested header payload',
          status: 'info',
          details: {
            headers: {
              'authorization': 'Bearer nested-secret',
              'x-visible': 'visible',
            },
            nested: [
              { 'x-sap-security-session': 'sap-secret' },
            ],
          },
        },
      ],
    })

    const [log] = await getODataLogs()

    expect(log?.proxyTrace?.[0]?.details).toEqual({
      name: 'x-api-key',
      value: '[Redacted]',
      policy: 'HeaderInjection',
    })
    expect(log?.proxyTrace?.[1]?.details).toEqual({
      header: 'x-csrf-token',
      actual: '[Redacted]',
      deniedValue: '[Redacted]',
      policy: 'HeaderGuard',
    })
    expect(log?.proxyTrace?.[2]?.details).toEqual({
      headers: {
        'authorization': '[Redacted]',
        'x-visible': 'visible',
      },
      nested: [
        { 'x-sap-security-session': '[Redacted]' },
      ],
    })
    expect(JSON.stringify(log)).not.toContain('api-secret')
    expect(JSON.stringify(log)).not.toContain('csrf-secret')
    expect(JSON.stringify(log)).not.toContain('nested-secret')
    expect(JSON.stringify(log)).not.toContain('sap-secret')
  })

  it('bounds large payloads and can omit payload storage by policy', async () => {
    const largePayload = { value: 'x'.repeat(128) }

    await addODataLog({
      id: 'large',
      timestamp: 1,
      method: 'POST',
      url: '/test',
      service: 'TestService',
      requestBody: largePayload,
      responseBody: largePayload,
    }, 100, { maxPayloadBytes: 32 })

    const [log] = await getODataLogs()
    expect(log?.requestBody).toMatchObject({
      __odxPayload: 'truncated',
      maxBytes: 32,
    })
    expect(log?.responseBody?.preview.length).toBeGreaterThan(0)

    await clearODataLogs()
    await addODataLog({
      id: 'omitted',
      timestamp: 2,
      method: 'POST',
      url: '/test',
      service: 'TestService',
      requestBody: { secret: true },
      responseBody: { secret: true },
    }, 100, { storePayloads: false })

    const [omitted] = await getODataLogs()
    expect(omitted?.requestBody).toBeUndefined()
    expect(omitted?.responseBody).toBeUndefined()
    expect(boundLogPayload({ value: 'ok' }, { storePayloads: false })).toBeUndefined()
  })
})
