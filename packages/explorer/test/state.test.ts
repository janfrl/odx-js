import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useSharedODataState } from '../composables/useODataState'

// Mock global fetch
globalThis.fetch = vi.fn()

describe('explorer State Composable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    const { config, logs, selectedService, selectedEntity } = useSharedODataState()
    config.value = { basePath: '/__odx__', services: [] }
    logs.value = []
    selectedService.value = null
    selectedEntity.value = null
  })

  it('fetches config correctly', async () => {
    const mockConfig = { basePath: '/api', mode: 'sdk', services: [] }
    ;(globalThis.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockConfig,
    })

    const { fetchConfig, config } = useSharedODataState()
    await fetchConfig()

    expect(globalThis.fetch).toHaveBeenCalledWith('/__odx__/config')
    expect(config.value.basePath).toBe('/api')
  })

  it('refreshes logs correctly', async () => {
    const mockLogs = [{ id: '1', method: 'GET', url: '/t', service: 'S' }]
    ;(globalThis.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockLogs,
    })

    const { refreshLogs, logs } = useSharedODataState()
    await refreshLogs()

    expect(globalThis.fetch).toHaveBeenCalledWith('/__odx__/logs')
    expect(logs.value).toHaveLength(1)
    expect(logs.value[0].id).toBe('1')
  })
})
