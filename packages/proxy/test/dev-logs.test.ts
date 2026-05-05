import { addODataLog, clearODataLogs, getODataLogs } from '@bc8-odx/core'
import { beforeEach, describe, expect, it } from 'vitest'

describe('proxy Dev Logs', () => {
  beforeEach(() => {
    clearODataLogs()
  })

  it('stores and retrieves logs', () => {
    addODataLog({
      id: '1',
      timestamp: Date.now(),
      method: 'GET',
      url: '/test',
      service: 'TestService',
    })

    const logs = getODataLogs()
    expect(logs).toHaveLength(1)
    expect(logs[0]?.id).toBe('1')
  })

  it('protects stored logs from returned array mutation', () => {
    addODataLog({
      id: '1',
      timestamp: 1,
      method: 'GET',
      url: '/test',
      service: 'TestService',
    })

    const logs = getODataLogs()
    logs.push({
      id: 'external',
      timestamp: 2,
      method: 'POST',
      url: '/external',
      service: 'ExternalService',
    })

    expect(getODataLogs()).toHaveLength(1)
    expect(getODataLogs()[0]?.id).toBe('1')
  })

  it('respects maximum log limit', () => {
    for (let i = 0; i < 110; i++) {
      addODataLog({ id: String(i), timestamp: i, method: 'GET', url: '/t', service: 'S' })
    }
    expect(getODataLogs()).toHaveLength(100)
  })
})
