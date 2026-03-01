import { describe, expect, it, vi, beforeEach } from 'vitest'
import { useSharedODataState } from '../composables/useODataState'

// Mock global fetch
global.fetch = vi.fn()

describe('Explorer State Composable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches config correctly', async () => {
    const mockConfig = { basePath: '/api', mode: 'sdk', services: [] }
    ;(global.fetch as any).mockResolvedValue({
      json: async () => mockConfig
    })

    const { fetchConfig, config } = useSharedODataState()
    await fetchConfig()

    expect(global.fetch).toHaveBeenCalledWith('/__sap_odata__/config')
    expect(config.value.basePath).toBe('/api')
  })

  it('refreshes logs correctly', async () => {
    const mockLogs = [{ id: '1', method: 'GET', url: '/t', service: 'S' }]
    ;(global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockLogs
    })

    const { refreshLogs, logs } = useSharedODataState()
    await refreshLogs()

    expect(global.fetch).toHaveBeenCalledWith('/__sap_odata__/logs')
    expect(logs.value).toHaveLength(1)
    expect(logs.value[0].id).toBe('1')
  })
})
