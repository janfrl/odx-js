import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useSharedODataState } from '../composables/useODataState'

// Mock global fetch
globalThis.fetch = vi.fn()

describe('explorer State Composable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    globalThis.localStorage?.clear()
    const {
      activeTab,
      config,
      logFilterService,
      logs,
      selectedEntity,
      selectedService,
      selectedTraceLogId,
    } = useSharedODataState()
    activeTab.value = 'overview'
    config.value = { basePath: '/__odx__', services: [] }
    logFilterService.value = null
    logs.value = []
    selectedService.value = null
    selectedEntity.value = null
    selectedTraceLogId.value = null
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

  it('clears server and local traffic logs', async () => {
    ;(globalThis.fetch as any).mockResolvedValue({ ok: true })

    const { clearLogs, logs } = useSharedODataState()
    logs.value = [{ id: '1', method: 'GET', url: '/t', service: 'S' } as any]

    await clearLogs()

    expect(globalThis.fetch).toHaveBeenCalledWith('/__odx__/logs', { method: 'DELETE' })
    expect(logs.value).toEqual([])
  })

  it('coordinates selected proxy trace log state', () => {
    const { activeTab, logs, selectedTraceLogId } = useSharedODataState()
    logs.value = [
      {
        id: 'trace-1',
        method: 'GET',
        url: '/api/odx/S/Products',
        service: 'S',
        proxyTrace: [{ label: 'Proxy', duration: 1 }],
      } as any,
    ]

    selectedTraceLogId.value = 'trace-1'
    activeTab.value = 'proxy'

    expect(selectedTraceLogId.value).toBe('trace-1')
    expect(activeTab.value).toBe('proxy')
    expect(logs.value[0]?.proxyTrace).toHaveLength(1)
  })

  it('keeps degraded service health until a forced online update', () => {
    const { config, services, updateServiceHealth } = useSharedODataState()
    config.value = {
      basePath: '/api/odx',
      services: [{ name: 'Northwind', route: 'northwind' }],
    }

    updateServiceHealth('Northwind', 'degraded')
    updateServiceHealth('Northwind', 'online')

    expect(services.value[0]?.health).toBe('degraded')

    updateServiceHealth('Northwind', 'online', true)

    expect(services.value[0]?.health).toBe('online')
  })
})
