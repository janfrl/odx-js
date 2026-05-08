import { createNuxtApp } from 'nuxt/app'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, nextTick } from 'vue'
import { useEntityExplorer } from '../composables/useEntityExplorer'
import { buildEntityPreviewCacheKey, buildSchemaEndpointUrl, useSharedODataState } from '../composables/useODataState'

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
      hasActiveLogFilters,
      hasFilteredOutLogs,
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
    expect(hasActiveLogFilters.value).toBe(false)
    expect(hasFilteredOutLogs.value).toBe(false)
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

  it('encodes service names when checking service health and generating a service', async () => {
    ;(globalThis.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ services: [{ name: 'R&D #1?', route: 'rd' }] }),
    })

    const { fetchConfig, generateService } = useSharedODataState()
    await fetchConfig()
    await nextTick()

    expect(globalThis.fetch).toHaveBeenCalledWith('/__odx__/schema?service=R%26D%20%231%3F')

    ;(globalThis.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    })

    await generateService('R&D #1?')

    expect(globalThis.fetch).toHaveBeenCalledWith('/__odx__/generate?service=R%26D%20%231%3F')
  })

  it('encodes service and entity set names when clearing mock data', async () => {
    ;(globalThis.fetch as any).mockResolvedValue({ ok: true })

    const { clearEntityMockData } = useSharedODataState()
    await clearEntityMockData('R&D #1?', 'Sales Orders?#&')

    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/__odx__/mockdata?service=R%26D%20%231%3F&entitySet=Sales%20Orders%3F%23%26',
      { method: 'DELETE' },
    )
  })

  it('builds raw metadata URLs with encoded service names and raw=true preserved', () => {
    expect(buildSchemaEndpointUrl('R&D #1?', { raw: true })).toBe('/__odx__/schema?service=R%26D%20%231%3F&raw=true')
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

  it('keeps pending traffic visible only in the all status filter', () => {
    const { filteredLogs, logFilterStatus, logs } = useSharedODataState()
    logs.value = [
      {
        id: 'pending-products',
        timestamp: '2026-05-05T09:00:00.000Z',
        method: 'GET',
        service: 'Northwind',
        path: '/Products',
        entitySet: 'Products',
        status: undefined,
        duration: 0,
        isPending: true,
      } as any,
      {
        id: 'ok-products',
        timestamp: '2026-05-05T09:01:00.000Z',
        method: 'GET',
        service: 'Northwind',
        path: '/Products',
        entitySet: 'Products',
        status: 200,
        duration: 12,
      } as any,
      {
        id: 'failed-products',
        timestamp: '2026-05-05T09:02:00.000Z',
        method: 'GET',
        service: 'Northwind',
        path: '/Products',
        entitySet: 'Products',
        status: 500,
        duration: 16,
      } as any,
    ]

    logFilterStatus.value = 'all'
    expect(filteredLogs.value.map(log => log.id)).toEqual(['pending-products', 'ok-products', 'failed-products'])

    logFilterStatus.value = 'success'
    expect(filteredLogs.value.map(log => log.id)).toEqual(['ok-products'])

    logFilterStatus.value = 'failures'
    expect(filteredLogs.value.map(log => log.id)).toEqual(['failed-products'])
  })

  it('detects when active traffic filters hide existing logs', () => {
    const { filteredLogs, hasActiveLogFilters, hasFilteredOutLogs, logFilterStatus, logs } = useSharedODataState()
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
      } as any,
    ]

    logFilterStatus.value = 'failures'

    expect(hasActiveLogFilters.value).toBe(true)
    expect(filteredLogs.value).toEqual([])
    expect(hasFilteredOutLogs.value).toBe(true)
  })

  it('clears all traffic log filters together', () => {
    const { clearLogFilters, hasActiveLogFilters, logFilterService, logFilterStatus, logSearch } = useSharedODataState()
    logFilterService.value = 'northwind'
    logFilterStatus.value = 'failures'
    logSearch.value = 'orders'

    expect(hasActiveLogFilters.value).toBe(true)

    clearLogFilters()

    expect(logFilterService.value).toBeNull()
    expect(logFilterStatus.value).toBe('all')
    expect(logSearch.value).toBe('')
    expect(hasActiveLogFilters.value).toBe(false)
  })

  it('preserves traffic log service filter when refreshed config still contains the service name', async () => {
    const { config, logFilterService, logFilterStatus, logSearch, logs, selectedTraceLogId } = useSharedODataState()
    logs.value = [
      {
        id: 'trace-1',
        timestamp: '2026-05-05T09:00:00.000Z',
        method: 'GET',
        service: 'Northwind',
        path: '/Products',
        status: 200,
        duration: 12,
        proxyTrace: [{ label: 'Proxy', duration: 1 }],
      } as any,
    ]
    logFilterService.value = 'Northwind'
    logFilterStatus.value = 'success'
    logSearch.value = 'products'
    selectedTraceLogId.value = 'trace-1'

    config.value = {
      basePath: '/api/odx',
      services: [{ name: 'Northwind', route: 'renamed-northwind' }],
    }
    await nextTick()

    expect(logFilterService.value).toBe('Northwind')
    expect(logFilterStatus.value).toBe('success')
    expect(logSearch.value).toBe('products')
    expect(selectedTraceLogId.value).toBe('trace-1')
    expect(logs.value.map(log => log.id)).toEqual(['trace-1'])
  })

  it('preserves traffic log service filter when refreshed config still contains the route alias', async () => {
    const { config, logFilterService, logFilterStatus, logSearch, logs, selectedTraceLogId } = useSharedODataState()
    logs.value = [
      {
        id: 'trace-1',
        timestamp: '2026-05-05T09:00:00.000Z',
        method: 'GET',
        service: 'Northwind',
        path: '/Products',
        status: 200,
        duration: 12,
        proxyTrace: [{ label: 'Proxy', duration: 1 }],
      } as any,
    ]
    logFilterService.value = 'northwind-api'
    logFilterStatus.value = 'success'
    logSearch.value = 'products'
    selectedTraceLogId.value = 'trace-1'

    config.value = {
      basePath: '/api/odx',
      services: [{ name: 'RenamedNorthwind', route: 'northwind-api' }],
    }
    await nextTick()

    expect(logFilterService.value).toBe('northwind-api')
    expect(logFilterStatus.value).toBe('success')
    expect(logSearch.value).toBe('products')
    expect(selectedTraceLogId.value).toBe('trace-1')
    expect(logs.value.map(log => log.id)).toEqual(['trace-1'])
  })

  it('clears only stale traffic log service filter after config refresh', async () => {
    const {
      config,
      logFilterService,
      logFilterStatus,
      logSearch,
      logs,
      selectedEntity,
      selectedService,
      selectedTraceLogId,
    } = useSharedODataState()
    ;(globalThis.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ entities: [] }),
    })
    logs.value = [
      {
        id: 'trace-1',
        timestamp: '2026-05-05T09:00:00.000Z',
        method: 'GET',
        service: 'Northwind',
        path: '/Products',
        status: 200,
        duration: 12,
        proxyTrace: [{ label: 'Proxy', duration: 1 }],
      } as any,
    ]
    selectedService.value = {
      name: 'SAP',
      route: 'sap',
      entities: [{ name: 'BusinessPartner', entitySet: 'BusinessPartners' }],
    } as any
    selectedEntity.value = 'BusinessPartners'
    logFilterService.value = 'old-northwind'
    logFilterStatus.value = 'success'
    logSearch.value = 'products'
    selectedTraceLogId.value = 'trace-1'

    config.value = {
      basePath: '/api/odx',
      services: [
        {
          name: 'SAP',
          route: 'sap',
          entities: [{ name: 'BusinessPartner', entitySet: 'BusinessPartners' }],
        },
      ],
    }
    await nextTick()

    expect(logFilterService.value).toBeNull()
    expect(logFilterStatus.value).toBe('success')
    expect(logSearch.value).toBe('products')
    expect(selectedTraceLogId.value).toBe('trace-1')
    expect(selectedService.value?.name).toBe('SAP')
    expect(selectedEntity.value).toBe('BusinessPartners')
    expect(logs.value.map(log => log.id)).toEqual(['trace-1'])
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

  it('preserves selected proxy trace when refreshed logs still contain it', async () => {
    const refreshedLogs = [
      {
        id: 'trace-1',
        method: 'GET',
        url: '/api/odx/S/Products',
        service: 'S',
        proxyTrace: [{ label: 'Proxy', duration: 1 }],
      },
      {
        id: 'trace-2',
        method: 'GET',
        url: '/api/odx/S/Orders',
        service: 'S',
        proxyTrace: [{ label: 'Proxy', duration: 2 }],
      },
    ] as any[]
    ;(globalThis.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => refreshedLogs,
    })
    const { refreshLogs, selectedTraceLogId } = useSharedODataState()
    selectedTraceLogId.value = 'trace-1'

    await refreshLogs()

    expect(selectedTraceLogId.value).toBe('trace-1')
  })

  it('clears selected proxy trace when refreshed logs no longer contain it', async () => {
    ;(globalThis.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: 'trace-2',
          method: 'GET',
          url: '/api/odx/S/Orders',
          service: 'S',
          proxyTrace: [{ label: 'Proxy', duration: 2 }],
        },
      ],
    })
    const { refreshLogs, selectedTraceLogId } = useSharedODataState()
    selectedTraceLogId.value = 'trace-1'

    await refreshLogs()

    expect(selectedTraceLogId.value).toBeNull()
  })

  it('clears selected proxy trace when traffic logs are cleared', async () => {
    ;(globalThis.fetch as any).mockResolvedValue({ ok: true })
    const { clearLogs, logs, selectedTraceLogId } = useSharedODataState()
    logs.value = [
      {
        id: 'trace-1',
        method: 'GET',
        url: '/api/odx/S/Products',
        service: 'S',
        proxyTrace: [{ label: 'Proxy', duration: 1 }],
      },
    ] as any[]
    selectedTraceLogId.value = 'trace-1'

    await clearLogs()

    expect(logs.value).toEqual([])
    expect(selectedTraceLogId.value).toBeNull()
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

  it('maps missing metadata from config to offline health before background checks finish', () => {
    const { config, services } = useSharedODataState()
    config.value = {
      basePath: '/api/odx',
      services: [
        {
          name: 'RemoteService',
          route: 'remote',
          metadata: { status: 'missing', stale: false, staleReason: null },
        },
      ],
    }

    expect(services.value[0]?.health).toBe('offline')
  })

  it('marks service health as degraded when schema health check reports stale metadata', async () => {
    ;(globalThis.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          basePath: '/api/odx',
          services: [{ name: 'RemoteService', route: 'remote' }],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          entities: [],
          metadata: { status: 'stale', stale: true, staleReason: 'Status: 503' },
        }),
      })

    const { fetchConfig, services } = useSharedODataState()
    await fetchConfig()
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(globalThis.fetch).toHaveBeenCalledWith('/__odx__/schema?service=RemoteService')
    expect(services.value[0]?.health).toBe('degraded')
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

  it('accepts sanitized production service config without secret-bearing fields', () => {
    const { config, services } = useSharedODataState()
    config.value = {
      basePath: '/api/odx',
      services: [
        {
          name: 'Northwind',
          route: 'northwind',
          strategy: 'proxied',
          entities: [{ name: 'Product', type: 'Product', properties: [], navigationProperties: [] }],
          isGenerated: false,
          version: 'v2',
        },
      ],
    }

    expect(services.value[0]).toMatchObject({
      name: 'Northwind',
      route: 'northwind',
      strategy: 'proxied',
      health: 'checking',
      entities: [{ name: 'Product' }],
      isGenerated: false,
      version: 'v2',
    })
    expect(services.value[0]?.url).toBeUndefined()
    expect(services.value[0]?.headers).toBeUndefined()
    expect(services.value[0]?.config).toBeUndefined()
  })

  it('preserves selected entity when refreshed config still contains it', async () => {
    const { config, selectedEntity, selectedService } = useSharedODataState()
    selectedService.value = {
      name: 'Northwind',
      route: 'northwind',
      entities: [{ name: 'Product', entitySet: 'Products' }],
    } as any
    selectedEntity.value = 'Products'

    config.value = {
      basePath: '/api/odx',
      services: [
        {
          name: 'Northwind',
          route: 'northwind',
          entities: [
            { name: 'Product', entitySet: 'Products' },
            { name: 'Order', entitySet: 'Orders' },
          ],
        },
      ],
    }
    await nextTick()

    expect(selectedService.value?.name).toBe('Northwind')
    expect(selectedEntity.value).toBe('Products')
  })

  it('clears stale selected entity when refreshed config no longer contains it', async () => {
    const { config, previewData, queryInput, queryMethod, selectedEntity, selectedService } = useSharedODataState()
    selectedService.value = {
      name: 'Northwind',
      route: 'northwind',
      entities: [{ name: 'Product', entitySet: 'Products' }],
    } as any
    selectedEntity.value = 'Products'
    previewData.value = [{ ID: 1 }]
    queryInput.value = '?$top=1'
    queryMethod.value = 'POST'

    config.value = {
      basePath: '/api/odx',
      services: [
        {
          name: 'Northwind',
          route: 'northwind',
          entities: [{ name: 'Order', entitySet: 'Orders' }],
        },
      ],
    }
    await nextTick()

    expect(selectedService.value?.name).toBe('Northwind')
    expect(selectedEntity.value).toBeNull()
    expect(previewData.value).toBeNull()
    expect(queryInput.value).toBe('?')
    expect(queryMethod.value).toBe('GET')
  })

  it('clears selected service and entity when refreshed config removes the service', async () => {
    const { config, previewData, selectedEntity, selectedService } = useSharedODataState()
    selectedService.value = {
      name: 'Northwind',
      route: 'northwind',
      entities: [{ name: 'Product', entitySet: 'Products' }],
    } as any
    selectedEntity.value = 'Products'
    previewData.value = [{ ID: 1 }]

    config.value = {
      basePath: '/api/odx',
      services: [
        {
          name: 'SAP',
          route: 'sap',
          entities: [{ name: 'BusinessPartner', entitySet: 'BusinessPartners' }],
        },
      ],
    }
    await nextTick()

    expect(selectedService.value).toBeNull()
    expect(selectedEntity.value).toBeNull()
    expect(previewData.value).toBeNull()
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

  it('escapes single quotes in visual query builder string filters', async () => {
    const { queryInput, queryState } = useEntityExplorer()

    queryState.value = {
      filters: {
        type: 'group',
        logic: 'and',
        items: [
          { type: 'rule', field: 'Name', operator: 'eq', value: 'Bob\'s Tea' },
        ],
      },
      select: [],
      expand: [],
      sortBy: [],
      top: null,
      skip: null,
    }
    await nextTick()

    expect(queryInput.value).toBe('?$filter=Name eq \'Bob\'\'s Tea\'')
  })

  it('escapes string values in visual query builder function filters', async () => {
    const { queryInput, queryState } = useEntityExplorer()

    queryState.value = {
      filters: {
        type: 'group',
        logic: 'and',
        items: [
          { type: 'rule', field: 'Name', operator: 'contains', value: 'Bob\'s' },
        ],
      },
      select: [],
      expand: [],
      sortBy: [],
      top: null,
      skip: null,
    }
    await nextTick()

    expect(queryInput.value).toBe('?$filter=contains(Name,\'Bob\'\'s\')')
  })

  it('encodes ampersands inside visual query builder string filters so they are not parsed as query separators', async () => {
    const { queryInput, queryState } = useEntityExplorer()

    queryState.value = {
      filters: {
        type: 'group',
        logic: 'and',
        items: [
          { type: 'rule', field: 'Name', operator: 'eq', value: 'R&D' },
        ],
      },
      select: [],
      expand: [],
      sortBy: [],
      top: null,
      skip: null,
    }
    await nextTick()

    expect(queryInput.value).toBe('?$filter=Name eq \'R%26D\'')
  })

  it('serializes numeric visual query builder values without string quotes', async () => {
    const { entitySchema, queryInput, selectedEntity, selectedService } = useSharedODataState()
    const schema = {
      entities: [
        {
          name: 'Product',
          entitySet: 'Products',
          properties: [{ name: 'Price', type: 'Edm.Decimal' }],
        },
      ],
    }
    selectedService.value = {
      name: 'Northwind',
      route: 'northwind',
      strategy: 'proxied',
    } as any
    ;(globalThis.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => schema,
    })
    selectedEntity.value = 'Products'
    await nextTick()
    await nextTick()
    entitySchema.value = schema
    const explorer = useEntityExplorer()

    explorer.queryState.value = {
      filters: {
        type: 'group',
        logic: 'and',
        items: [
          { type: 'rule', field: 'Price', operator: 'ge', value: '12.5' },
        ],
      },
      select: [],
      expand: [],
      sortBy: [],
      top: 25,
      skip: 50,
    }
    await nextTick()

    expect(queryInput.value).toBe('?$filter=Price ge 12.5&$top=25&$skip=50')
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
    config.value = {
      basePath: '/api/odx',
      services: [
        {
          name: 'Northwind',
          route: 'northwind',
          strategy: 'proxied',
          entities: [{ name: 'Product', entitySet: 'Products' }],
        },
      ],
    }
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
    expect(entityDataCache.value[buildEntityPreviewCacheKey('Northwind', 'Products')]).toEqual({
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

  it('encodes delete item IDs while preserving delete success behavior', async () => {
    vi.stubGlobal('confirm', vi.fn(() => true))
    const { config, previewData, selectedEntity, selectedService } = useSharedODataState()
    config.value = {
      basePath: '/api/odx',
      services: [
        {
          name: 'Northwind',
          route: 'northwind-api',
          strategy: 'proxied',
          entities: [{ name: 'Product', entitySet: 'Products' }],
        },
      ],
    }
    selectedService.value = {
      name: 'Northwind',
      route: 'northwind-api',
      strategy: 'proxied',
    } as any
    ;(globalThis.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ entities: [] }),
    })
    selectedEntity.value = 'Products'
    await nextTick()
    await nextTick()

    ;(globalThis.fetch as any).mockClear()
    ;(globalThis.fetch as any)
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({ value: [{ ID: 'refreshed' }] }),
      })

    const { deleteItem } = useEntityExplorer()
    const nuxtApp = createNuxtApp({
      vueApp: createApp({}),
      payload: { config: { public: {}, app: {} }, state: {} },
    } as any)
    await nuxtApp.runWithContext(() => deleteItem('A/B?x=1&R #2'))
    await nextTick()

    expect(globalThis.fetch).toHaveBeenNthCalledWith(
      1,
      '/api/odx/northwind-api/Products?id=A%2FB%3Fx%3D1%26R%20%232',
      { method: 'DELETE' },
    )
    expect(nuxtApp.payload.state.$stoasts).toMatchObject([{
      title: 'Item A/B?x=1&R #2 deleted successfully',
      icon: 'i-lucide-circle-check',
      color: 'success',
    }])
    expect(globalThis.fetch).toHaveBeenNthCalledWith(2, '/api/odx/northwind-api/Products', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    })
    expect(previewData.value).toEqual([{ ID: 'refreshed' }])
  })

  it('restores cached entity preview state when reselecting an entity', async () => {
    const { entityDataCache, previewData, previewError, queryInput, queryMethod, queryState, selectedEntity, selectedService } = useSharedODataState()
    selectedService.value = { name: 'Northwind', route: 'northwind' } as any
    entityDataCache.value[buildEntityPreviewCacheKey('Northwind', 'Products')] = {
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

  it('does not restore cached entity preview state for colliding service and entity names', async () => {
    const { entityDataCache, previewData, queryInput, queryState, selectedEntity, selectedService } = useSharedODataState()
    selectedService.value = { name: 'Northwind', route: 'northwind' } as any
    entityDataCache.value[buildEntityPreviewCacheKey('Northwind', 'Products:Variants')] = {
      data: [{ ID: 1, Name: 'Wrong cached item' }],
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

    selectedService.value = { name: 'Northwind:Products', route: 'northwind-products' } as any
    selectedEntity.value = 'Variants'
    await nextTick()
    await nextTick()

    expect(previewData.value).toBeNull()
    expect(queryInput.value).toBe('?')
    expect(queryState.value.select).toEqual([])
    expect(globalThis.fetch).toHaveBeenCalledWith('/__odx__/schema?service=Northwind%3AProducts')
  })
})
