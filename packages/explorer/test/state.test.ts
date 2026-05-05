import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { useEntityExplorer } from '../composables/useEntityExplorer'
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
      filteredLogs,
      logFilterService,
      logFilterStatus,
      logSearch,
      logs,
      previewData,
      previewError,
      previewLoading,
      queryInput,
      queryMethod,
      queryState,
      selectedEntity,
      selectedService,
      selectedTraceLogId,
      sessionHeaders,
      useCORSBridge,
      entityDataCache,
      entitySchema,
      entitySchemaLoading,
      updateServiceHealth,
    } = useSharedODataState()
    vi.stubGlobal('useSharedODataState', useSharedODataState)
    vi.stubGlobal('useToast', () => ({ add: vi.fn() }))
    ;['Northwind', 'SAP'].forEach(name => updateServiceHealth(name, 'checking', true))
    activeTab.value = 'overview'
    config.value = { basePath: '/__odx__', services: [] }
    logFilterService.value = null
    logFilterStatus.value = 'all'
    logSearch.value = ''
    logs.value = []
    selectedService.value = null
    selectedEntity.value = null
    selectedTraceLogId.value = null
    previewLoading.value = false
    previewError.value = null
    previewData.value = null
    queryInput.value = '?'
    queryMethod.value = 'GET'
    queryState.value = {
      filters: {
        type: 'group',
        logic: 'and',
        items: [],
      },
      select: [],
      expand: [],
      sortBy: [],
      top: null,
      skip: null,
    }
    entitySchema.value = null
    entitySchemaLoading.value = false
    entityDataCache.value = {}
    sessionHeaders.value = {}
    useCORSBridge.value = true
    expect(filteredLogs.value).toEqual([])
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

  it('filters traffic logs by service, search text, and failure status', () => {
    const { config, filteredLogs, logFilterService, logFilterStatus, logSearch, logs } = useSharedODataState()
    config.value = {
      basePath: '/api/odx',
      services: [
        { name: 'Northwind', route: 'northwind' },
        { name: 'SAP', route: 'sap' },
      ],
    }
    logs.value = [
      {
        id: 'ok-products',
        timestamp: '2026-05-05T09:00:00.000Z',
        method: 'GET',
        service: 'Northwind',
        path: '/Products',
        entitySet: 'Products',
        status: 200,
        duration: 12,
        targetUrl: 'https://example.test/odata/Products',
      } as any,
      {
        id: 'failed-orders',
        timestamp: '2026-05-05T09:01:00.000Z',
        method: 'PATCH',
        service: 'Northwind',
        path: '/Orders(1)',
        entitySet: 'Orders',
        status: 500,
        duration: 31,
        targetUrl: 'https://example.test/odata/Orders(1)',
      } as any,
      {
        id: 'sap-business-partners',
        timestamp: '2026-05-05T09:02:00.000Z',
        method: 'GET',
        service: 'SAP',
        path: '/BusinessPartner',
        entitySet: 'BusinessPartner',
        status: 404,
        duration: 20,
        targetUrl: 'https://sap.test/BusinessPartner',
      } as any,
    ]

    logFilterService.value = 'northwind'
    logFilterStatus.value = 'failures'
    logSearch.value = 'orders patch'

    expect(filteredLogs.value.map(log => log.id)).toEqual(['failed-orders'])
  })

  it('filters traffic logs to non-failures and matches service route aliases', () => {
    const { config, filteredLogs, logFilterService, logFilterStatus, logSearch, logs } = useSharedODataState()
    config.value = {
      basePath: '/api/odx',
      services: [{ name: 'Northwind', route: 'northwind-api' }],
    }
    logs.value = [
      {
        id: 'ok-products',
        timestamp: '2026-05-05T09:00:00.000Z',
        method: 'GET',
        service: 'Northwind',
        path: '/Products',
        entitySet: 'Products',
        status: 204,
        duration: 12,
      } as any,
      {
        id: 'failed-products',
        timestamp: '2026-05-05T09:01:00.000Z',
        method: 'DELETE',
        service: 'Northwind',
        path: '/Products(1)',
        entitySet: 'Products',
        status: 403,
        duration: 18,
      } as any,
    ]

    logFilterService.value = 'northwind-api'
    logFilterStatus.value = 'success'
    logSearch.value = 'products'

    expect(filteredLogs.value.map(log => log.id)).toEqual(['ok-products'])
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

  it('maps configured services with default and overridden health states', () => {
    const { config, services, updateServiceHealth } = useSharedODataState()
    config.value = {
      basePath: '/api/odx',
      services: [
        { name: 'Northwind', route: 'northwind' },
        { name: 'SAP', route: 'sap', health: 'online' },
      ],
    }

    expect(services.value.map(s => [s.name, s.health])).toEqual([
      ['Northwind', 'checking'],
      ['SAP', 'checking'],
    ])

    updateServiceHealth('Northwind', 'offline')
    updateServiceHealth('SAP', 'online')

    expect(services.value.map(s => [s.name, s.health])).toEqual([
      ['Northwind', 'offline'],
      ['SAP', 'online'],
    ])
  })

  it('serializes visual query state into an OData query string', async () => {
    const { queryInput, queryState } = useEntityExplorer()

    queryState.value = {
      filters: {
        type: 'group',
        logic: 'and',
        items: [
          { type: 'rule', field: 'Name', operator: 'contains', value: 'Tea' },
          { type: 'rule', field: 'Price', operator: 'gt', value: 10 },
        ],
      },
      select: ['ID', 'Name'],
      expand: ['Category'],
      sortBy: [{ field: 'Name', direction: 'asc' }],
      top: 5,
      skip: 10,
    }
    await nextTick()

    expect(queryInput.value).toBe('?$select=ID,Name&$expand=Category&$filter=contains(Name,\'Tea\') and Price gt 10&$orderby=Name asc&$top=5&$skip=10')
  })

  it('resets visual query state back to the entity browser default', async () => {
    const { queryInput, queryState, resetQuery } = useEntityExplorer()
    queryState.value = {
      filters: {
        type: 'group',
        logic: 'or',
        items: [{ type: 'rule', field: 'Name', operator: 'eq', value: 'Tea' }],
      },
      select: ['ID'],
      expand: ['Category'],
      sortBy: [{ field: 'Name', direction: 'desc' }],
      top: 1,
      skip: 2,
    }
    await nextTick()

    resetQuery()

    expect(queryInput.value).toBe('?')
    expect(queryState.value).toEqual({
      filters: {
        type: 'group',
        logic: 'and',
        items: [],
      },
      select: [],
      expand: [],
      sortBy: [],
      top: null,
      skip: null,
    })
  })

  it('fetches entity data through the proxied route and caches the query state', async () => {
    const { config, entityDataCache, queryInput, queryState, selectedEntity, selectedService, sessionHeaders } = useSharedODataState()
    config.value = { basePath: '/api/odx', services: [] }
    ;(globalThis.fetch as any).mockImplementation(async (url: string) => {
      if (url === '/__odx__/schema?service=Northwind') {
        return {
          ok: true,
          json: async () => ({ entities: [] }),
        }
      }
      return {
        ok: true,
        text: async () => JSON.stringify({ value: [{ ID: 1, Name: 'Tea' }] }),
      }
    })
    selectedService.value = {
      name: 'Northwind',
      route: 'northwind',
      strategy: 'proxied',
    } as any
    selectedEntity.value = 'Products'
    await nextTick()
    queryInput.value = '?$top=1'
    queryState.value = {
      filters: { type: 'group', logic: 'and', items: [] },
      select: ['ID'],
      expand: [],
      sortBy: [],
      top: 1,
      skip: null,
    }
    await nextTick()
    sessionHeaders.value = { 'x-session': 'abc' }

    const { previewData, refreshEntityData } = useEntityExplorer()
    await refreshEntityData()

    expect(globalThis.fetch).toHaveBeenCalledWith('/api/odx/northwind/Products?$select=ID&$top=1', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'x-session': 'abc',
      },
    })
    expect(previewData.value).toEqual([{ ID: 1, Name: 'Tea' }])
    expect(entityDataCache.value['Northwind:Products']).toEqual({
      data: [{ ID: 1, Name: 'Tea' }],
      error: null,
      query: '?$select=ID&$top=1',
      method: 'GET',
      queryState: {
        filters: { type: 'group', logic: 'and', items: [] },
        select: ['ID'],
        expand: [],
        sortBy: [],
        top: 1,
        skip: null,
      },
    })
  })

  it('restores cached entity preview state when reselecting an entity', async () => {
    const { entityDataCache, previewData, previewError, queryInput, queryMethod, queryState, selectedEntity, selectedService } = useSharedODataState()
    selectedService.value = { name: 'Northwind', route: 'northwind' } as any
    entityDataCache.value['Northwind:Products'] = {
      data: [{ ID: 1, Name: 'Tea' }],
      error: null,
      query: '?$select=ID',
      method: 'GET',
      queryState: {
        filters: { type: 'group', logic: 'and', items: [] },
        select: ['ID'],
        expand: [],
        sortBy: [],
        top: null,
        skip: null,
      },
    }
    ;(globalThis.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ entities: [] }),
    })

    selectedEntity.value = 'Products'
    await nextTick()
    await nextTick()

    expect(previewData.value).toEqual([{ ID: 1, Name: 'Tea' }])
    expect(previewError.value).toBeNull()
    expect(queryInput.value).toBe('?$select=ID')
    expect(queryMethod.value).toBe('GET')
    expect(queryState.value.select).toEqual(['ID'])
    expect(globalThis.fetch).toHaveBeenCalledWith('/__odx__/schema?service=Northwind')
  })
})
