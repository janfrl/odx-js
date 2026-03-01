import { beforeEach, describe, expect, it } from 'vitest'
import { addODataLog, clearODataLogs, getODataLogs } from '../src/utils/dev-logs'

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

  it('respects maximum log limit', () => {
    for (let i = 0; i < 110; i++) {
      addODataLog({ id: String(i), timestamp: i, method: 'GET', url: '/t', service: 'S' })
    }
    expect(getODataLogs()).toHaveLength(100)
  })
})
