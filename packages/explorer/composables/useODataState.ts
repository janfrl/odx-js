import type { EntityMapping } from '@bc8-odx/core'

export interface ODataServiceState {
  name: string
  url: string
  route: string
  strategy: 'proxied' | 'direct'
  entities: EntityMapping[]
  config: {
    headers?: Record<string, string>
    auth?: any
  }
  headers?: Record<string, string>
  health?: 'online' | 'offline' | 'checking' | 'degraded'
  icon?: string
}

export interface ODataConfig {
  basePath: string
  services: any[]
  versions?: {
    node: string
    module: string
  }
}

export interface ProxyTraceEntry {
  label: string
  duration: number | string
  status?: number
  timestamp?: number
  details?: any
}

export interface ODataLog {
  id: string
  timestamp: string
  method: string
  service: string
  path: string
  url?: string
  targetUrl?: string
  entitySet?: string
  status: number
  duration: number
  isPending?: boolean
  proxyTrace?: ProxyTraceEntry[]
}

export type LogFilterStatus = 'all' | 'success' | 'failures'

export interface VisualQueryState {
  filters: {
    type: 'group'
    logic: 'and' | 'or'
    items: any[]
  }
  select: string[]
  expand: string[]
  sortBy: { field: string, direction: 'asc' | 'desc' }[]
  top: number | null
  skip: number | null
}

export interface EditorState {
  show: boolean
  mode: 'view' | 'create' | 'update' | 'headers' | 'response'
  json: string
  loading: boolean
  error: string | null
  original: any
}

function getDefaultQueryState(): VisualQueryState {
  return {
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
}

function serviceHasEntity(service: any, entity: string): boolean {
  return (service.entities || []).some((item: any) =>
    item.entitySet === entity || item.name === entity,
  )
}

function serviceMatchesLogFilter(service: any, filter: string): boolean {
  const normalizedFilter = filter.toLowerCase()
  return [service.name, service.route].some(value =>
    typeof value === 'string' && value.toLowerCase() === normalizedFilter,
  )
}

// Global Singleton state
const activeTab = ref('overview')
const logs = ref<ODataLog[]>([])
const config = ref<ODataConfig>({ basePath: '/__odx__', services: [] })
const selectedService = ref<ODataServiceState | null>(null)
const selectedEntity = ref<string | null>(null)
const generatingStatus = ref<Record<string, boolean>>({})
const sessionHeaders = ref<Record<string, string>>({})
const logFilterService = ref<string | null>(null)
const logFilterStatus = ref<LogFilterStatus>('all')
const logSearch = ref('')
const useCORSBridge = ref(true)
const selectedTraceLogId = ref<string | null>(null)
const globalViewMode = ref<'explorer' | 'schema'>('explorer')

// Entity Preview state
const previewLoading = ref(false)
const previewError = ref<string | null>(null)
const previewData = ref<Record<string, any>[] | null>(null)
const queryInput = ref('?')
const queryMethod = ref('GET')
const queryState = ref<VisualQueryState>(getDefaultQueryState())
const entitySchema = ref<any>(null)
const entitySchemaLoading = ref(false)

// Cache for entity data to avoid reloading when switching entities
const entityDataCache = ref<Record<string, {
  data: any[]
  error: string | null
  query: string
  method: string
  queryState: VisualQueryState
}>>({})

// Schema Explorer state
const initializedServices = ref(new Set<string>())
const schemaFocusedServices = ref(new Set<string>())
const lastSelectedServiceForGraph = ref<string | null>(null)

const DEGRADED_STORAGE_KEY = 'odx:degraded-services'
const LOG_SEARCH_SEPARATOR_RE = /\s+/

function loadDegradedServices(): Record<string, 'degraded'> {
  try {
    const raw = localStorage.getItem(DEGRADED_STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  }
  catch { return {} }
}

function saveDegradedServices(overrides: Record<string, string>): void {
  const degraded = Object.fromEntries(
    Object.entries(overrides).filter(([, v]) => v === 'degraded'),
  )
  try {
    if (Object.keys(degraded).length > 0)
      localStorage.setItem(DEGRADED_STORAGE_KEY, JSON.stringify(degraded))
    else
      localStorage.removeItem(DEGRADED_STORAGE_KEY)
  }
  catch {}
}

const serviceHealthOverrides = ref<Record<string, 'online' | 'offline' | 'checking' | 'degraded'>>(loadDegradedServices())

export interface SharedODataState {
  activeTab: Ref<string>
  logs: Ref<ODataLog[]>
  config: Ref<ODataConfig>
  services: ComputedRef<ODataServiceState[]>
  selectedService: Ref<ODataServiceState | null>
  selectedEntity: Ref<string | null>
  generatingStatus: Ref<Record<string, boolean>>
  sessionHeaders: Ref<Record<string, string>>
  logFilterService: Ref<string | null>
  logFilterStatus: Ref<LogFilterStatus>
  logSearch: Ref<string>
  filteredLogs: ComputedRef<ODataLog[]>
  hasActiveLogFilters: ComputedRef<boolean>
  hasFilteredOutLogs: ComputedRef<boolean>
  useCORSBridge: Ref<boolean>
  selectedTraceLogId: Ref<string | null>
  previewLoading: Ref<boolean>
  previewError: Ref<string | null>
  previewData: Ref<Record<string, any>[] | null>
  queryInput: Ref<string>
  queryMethod: Ref<string>
  queryState: Ref<VisualQueryState>
  entitySchema: Ref<any>
  entitySchemaLoading: Ref<boolean>
  entityDataCache: Ref<Record<string, {
    data: any[]
    error: string | null
    query: string
    method: string
    queryState: VisualQueryState
  }>>
  globalViewMode: Ref<'explorer' | 'schema'>
  initializedServices: Ref<Set<string>>
  schemaFocusedServices: Ref<Set<string>>
  lastSelectedServiceForGraph: Ref<string | null>
  fetchConfig: () => Promise<void>
  refreshLogs: () => Promise<void>
  generateService: (name: string) => Promise<void>
  clearLogFilters: () => void
  clearLogs: () => Promise<void>
  clearEntityMockData: (service: string, entitySet: string) => Promise<void>
  updateServiceHealth: (name: string, health: 'online' | 'offline' | 'checking' | 'degraded', force?: boolean) => void
}

export function useSharedODataState(): SharedODataState {
  function updateServiceHealth(name: string, health: 'online' | 'offline' | 'checking' | 'degraded', force = false): void {
    // Background schema checks (local EDMX) must not clear a 'degraded' state — only
    // an explicit successful regeneration (force=true) is allowed to do that.
    if (health === 'online' && serviceHealthOverrides.value[name] === 'degraded' && !force)
      return
    serviceHealthOverrides.value[name] = health
    saveDegradedServices(serviceHealthOverrides.value)
    // Ensure selectedService ref is updated if it's the one being changed
    if (selectedService.value && selectedService.value.name === name) {
      selectedService.value = { ...selectedService.value, health }
    }
  }

  async function checkServiceHealth(name: string): Promise<void> {
    try {
      const res = await fetch(`/__odx__/schema?service=${name}`)
      updateServiceHealth(name, res.ok ? 'online' : 'offline')
    }
    catch {
      updateServiceHealth(name, 'offline')
    }
  }

  async function fetchConfig(): Promise<void> {
    try {
      const res = await fetch('/__odx__/config')
      if (res.ok) {
        config.value = await res.json()
        // Trigger background health checks for all services
        config.value.services?.forEach((s: any) => {
          checkServiceHealth(s.name)
        })
      }
    }
    catch (e) {
      console.error('[ODataState] Failed to fetch config', e)
    }
  }

  async function refreshLogs(): Promise<void> {
    try {
      const res = await fetch('/__odx__/logs')
      if (res.ok) {
        logs.value = await res.json()
        reconcileSelectedTraceLog()
      }
    }
    catch (e) {
      console.error('[ODataState] Failed to refresh logs', e)
    }
  }

  function reconcileSelectedTraceLog(): void {
    if (selectedTraceLogId.value && !logs.value.some(log => log.id === selectedTraceLogId.value)) {
      selectedTraceLogId.value = null
    }
  }

  function clearSelectedEntityState(): void {
    selectedEntity.value = null
    entitySchema.value = null
    previewData.value = null
    previewError.value = null
    queryInput.value = '?'
    queryMethod.value = 'GET'
    queryState.value = getDefaultQueryState()
  }

  const services = computed(() => {
    const data = config.value.services || []
    return data.map((s: any) => {
      return {
        ...s,
        health: serviceHealthOverrides.value[s.name] || s.health || 'checking',
      }
    })
  })

  const filteredLogs = computed(() => {
    const serviceFilter = logFilterService.value?.toLowerCase()
    const statusFilter = logFilterStatus.value
    const searchTokens = logSearch.value
      .trim()
      .toLowerCase()
      .split(LOG_SEARCH_SEPARATOR_RE)
      .filter(Boolean)

    return logs.value.filter((log: ODataLog) => {
      if (serviceFilter) {
        if (!log.service)
          return false
        const serviceName = log.service.toLowerCase()
        const matchesService = serviceName === serviceFilter
          || services.value.some(service => service.name.toLowerCase() === serviceName && service.route?.toLowerCase() === serviceFilter)
        if (!matchesService)
          return false
      }

      if (statusFilter !== 'all') {
        if (log.isPending || log.status === undefined || log.status === null)
          return false
        const status = Number(log.status)
        const failed = status >= 400
        if (statusFilter === 'failures' && !failed)
          return false
        if (statusFilter === 'success' && failed)
          return false
      }

      if (searchTokens.length > 0) {
        const searchable = [
          log.service,
          log.entitySet,
          log.path,
          log.url,
          log.targetUrl,
          log.method,
          log.status,
        ]
          .filter(value => value !== undefined && value !== null)
          .join(' ')
          .toLowerCase()

        if (!searchTokens.every(token => searchable.includes(token)))
          return false
      }

      return true
    })
  })

  const hasActiveLogFilters = computed(() => {
    return Boolean(logFilterService.value)
      || logFilterStatus.value !== 'all'
      || logSearch.value.trim().length > 0
  })

  const hasFilteredOutLogs = computed(() => {
    return hasActiveLogFilters.value
      && logs.value.length > 0
      && filteredLogs.value.length === 0
  })

  watch(config, (data) => {
    if (selectedService.value) {
      const currentService = selectedService.value
      const updated = data.services.find((s: any) => s.name === currentService.name)
      if (updated) {
        selectedService.value = updated
        if (selectedEntity.value && !serviceHasEntity(updated, selectedEntity.value)) {
          clearSelectedEntityState()
        }
      }
      else {
        selectedService.value = null
        clearSelectedEntityState()
      }
    }

    if (logFilterService.value && !data.services.some((s: any) => serviceMatchesLogFilter(s, logFilterService.value!))) {
      logFilterService.value = null
    }
  }, { deep: true })

  async function generateService(name: string): Promise<void> {
    generatingStatus.value[name] = true
    try {
      const res = await fetch(`/__odx__/generate?service=${name}`)
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        const msg = body?.message || body?.statusMessage || `Generation failed (${res.status})`
        throw new Error(msg)
      }
      const body = await res.json().catch(() => null)
      await fetchConfig()
      if (body?.stale) {
        updateServiceHealth(name, 'degraded')
        const err = new Error(body.staleReason || 'SAP unreachable — using cached metadata') as any
        err.stale = true
        throw err
      }
      else {
        updateServiceHealth(name, 'online', true)
      }
    }
    finally {
      generatingStatus.value[name] = false
    }
  }

  async function clearLogs(): Promise<void> {
    try {
      await fetch('/__odx__/logs', { method: 'DELETE' })
      logs.value = []
      selectedTraceLogId.value = null
    }
    catch (e) {
      console.error('[ODataState] Failed to clear logs', e)
    }
  }

  function clearLogFilters(): void {
    logFilterService.value = null
    logFilterStatus.value = 'all'
    logSearch.value = ''
  }

  async function clearEntityMockData(service: string, entitySet: string): Promise<void> {
    try {
      await fetch(`/__odx__/mockdata?service=${service}&entitySet=${entitySet}`, { method: 'DELETE' })
    }
    catch (e) {
      console.error(`[ODataState] Failed to clear mock data for ${entitySet}`, e)
      throw e
    }
  }

  return {
    activeTab,
    logs,
    config,
    services,
    selectedService,
    selectedEntity,
    generatingStatus,
    sessionHeaders,
    logFilterService,
    logFilterStatus,
    logSearch,
    filteredLogs,
    hasActiveLogFilters,
    hasFilteredOutLogs,
    useCORSBridge,
    selectedTraceLogId,
    previewLoading,
    previewError,
    previewData,
    queryInput,
    queryMethod,
    queryState,
    entitySchema,
    entitySchemaLoading,
    entityDataCache,
    globalViewMode,
    initializedServices,
    schemaFocusedServices,
    lastSelectedServiceForGraph,
    fetchConfig,
    refreshLogs,
    generateService,
    clearLogFilters,
    clearLogs,
    clearEntityMockData,
    updateServiceHealth,
  }
}

// Watch for selectedEntity changes to update the entitySchema and restore cached data
watch(selectedEntity, async (newEntity) => {
  const { updateServiceHealth } = useSharedODataState()

  if (!newEntity || !selectedService.value) {
    entitySchema.value = null
    previewData.value = null
    previewError.value = null
    return
  }

  const svcName = selectedService.value.name
  const cacheKey = `${svcName}:${newEntity}`
  const cached = entityDataCache.value[cacheKey]

  if (cached) {
    previewData.value = cached.data
    previewError.value = cached.error
    queryInput.value = cached.query
    queryMethod.value = cached.method
    queryState.value = JSON.parse(JSON.stringify(cached.queryState))
  }
  else {
    previewData.value = null
    previewError.value = null
    queryMethod.value = 'GET'
    queryInput.value = '?'
    queryState.value = getDefaultQueryState()
  }

  entitySchemaLoading.value = true
  try {
    const res = await fetch(`/__odx__/schema?service=${svcName}`)
    if (res.ok) {
      entitySchema.value = await res.json()
      updateServiceHealth(svcName, 'online')
    }
    else {
      updateServiceHealth(svcName, 'offline')
    }
  }
  catch (e) {
    console.error(`[ODataState] Failed to fetch schema for ${newEntity}`, e)
    updateServiceHealth(svcName, 'offline')
  }
  finally {
    entitySchemaLoading.value = false
  }
})
