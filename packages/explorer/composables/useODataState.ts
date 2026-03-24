import type { EntityMapping } from '@bc8-odx/core'
import { computed, ref, watch } from 'vue'

export interface ODataServiceState {
  name: string
  route?: string
  entities?: EntityMapping[]
  isGenerated?: boolean
  version?: 'v2' | 'v4' | null
  strategy?: 'proxied' | 'direct'
  health?: 'online' | 'offline' | 'checking'
}

export interface ODataConfig {
  basePath: string
  mode: string
  services: ODataServiceState[]
  forwardAuthHeader: boolean
  versions: { node: string, module: string }
}

export interface ProxyTraceEntry {
  timestamp: number
  label: string
  message: string
  details?: any
}

export interface ODataLog {
  id: string
  timestamp: number
  method: string
  url: string
  targetUrl?: string
  service: string
  entitySet?: string
  status?: number
  duration?: number
  requestBody?: any
  requestHeaders?: Record<string, string>
  responseBody?: any
  proxyTrace?: ProxyTraceEntry[]
}

export interface FilterRule {
  type: 'rule'
  field: string
  operator: string
  value: any
}

export interface FilterGroup {
  type: 'group'
  logic: 'and' | 'or'
  items: (FilterRule | FilterGroup)[]
}

export interface VisualQueryState {
  filters: FilterGroup
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
  original: Record<string, unknown> | null
}

const config = ref<ODataConfig>({
  basePath: '/api/odx',
  mode: 'sdk',
  services: [],
  forwardAuthHeader: true,
  versions: { node: '', module: '1.0.0' },
})
const activeTab = ref('services')
const logs = ref<ODataLog[]>([])
const selectedService = ref<ODataServiceState | null>(null)
const selectedEntity = ref<string | null>(null)
const generatingStatus = ref<Record<string, boolean>>({})
const sessionHeaders = ref<Record<string, string>>({})
const logFilterService = ref<string | null>(null)
const useCORSBridge = ref(true)

const previewLoading = ref(false)
const previewError = ref<string | null>(null)
const previewData = ref<Record<string, any>[]>([])
const queryInput = ref('?')
const queryMethod = ref('GET')
const queryState = ref<VisualQueryState>({
  filters: [],
  select: [],
  expand: [],
  sortBy: [],
  top: null,
  skip: null,
})
const entitySchema = ref<any>(null)
const entitySchemaLoading = ref(false)

// Per-entity cache for data and query state
const entityDataCache = ref<Record<string, {
  data: any[]
  error: string | null
  query: string
  method: string
  queryState: VisualQueryState
}>>({})

const initializedServices = ref<Set<string>>(new Set())
const schemaFocusedServices = ref<Set<string>>(new Set())
const lastSelectedServiceForGraph = ref<string | null>(null)
const globalViewMode = ref<'explorer' | 'schema'>('explorer')

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

// GLOBAL SYNC LOGIC (Persists across unmounts)

// 1. Service Change: Reset everything and fetch new schema
watch(selectedService, async (newSvc) => {
  selectedEntity.value = null
  previewData.value = []
  previewError.value = null
  queryInput.value = '?'
  queryMethod.value = 'GET'
  queryState.value = getDefaultQueryState()
  entitySchema.value = null

  if (newSvc) {
    const svcInConfig = config.value.services.find(s => s.name === newSvc.name)
    entitySchemaLoading.value = true
    try {
      const res = await fetch(`/__odx__/schema?service=${newSvc.name}`)
      if (res.ok) {
        entitySchema.value = await res.json()
        if (svcInConfig)
          svcInConfig.health = 'online'
      }
      else {
        if (svcInConfig)
          svcInConfig.health = 'offline'
      }
    }
    catch (e) {
      console.error('[SharedState] Failed to fetch schema:', e)
      if (svcInConfig)
        svcInConfig.health = 'offline'
    }
    finally {
      entitySchemaLoading.value = false
    }
  }
})

// 2. Entity Change: Restore from cache or reset
watch(selectedEntity, (newEntity) => {
  if (newEntity && selectedService.value) {
    const cacheKey = `${selectedService.value.name}:${newEntity}`
    const cache = entityDataCache.value[cacheKey]

    if (cache) {
      previewData.value = [...cache.data]
      previewError.value = cache.error
      queryInput.value = cache.query
      queryMethod.value = cache.method || 'GET'
      queryState.value = cache.queryState ? JSON.parse(JSON.stringify(cache.queryState)) : getDefaultQueryState()
    }
    else {
      previewData.value = []
      previewError.value = null
      queryInput.value = '?'
      queryMethod.value = 'GET'
      queryState.value = getDefaultQueryState()
    }
  }
  else {
    previewData.value = []
    previewError.value = null
    queryInput.value = '?'
    queryMethod.value = 'GET'
    queryState.value = getDefaultQueryState()
  }
})

export function useSharedODataState(): any {
  async function fetchConfig(): Promise<void> {
    try {
      const res = await fetch('/__odx__/config')
      const data = (await res.json()) as ODataConfig

      // Initialize with 'online' or keep previous health if available
      data.services = data.services.map((s) => {
        const existing = config.value.services.find(ex => ex.name === s.name)
        return { ...s, health: existing?.health || 'online' }
      })

      config.value = data

      // Kick off background health checks via schema fetch
      data.services.forEach((svc) => {
        fetch(`/__odx__/schema?service=${svc.name}`).then((r) => {
          const s = config.value.services.find(x => x.name === svc.name)
          if (s)
            s.health = r.ok ? 'online' : 'offline'
        }).catch(() => {
          const s = config.value.services.find(x => x.name === svc.name)
          if (s)
            s.health = 'offline'
        })
      })

      if (selectedService.value) {
        const updated = data.services.find(s => s.name === selectedService.value?.name)
        if (updated) {
          selectedService.value = updated
        }
      }
    }
    catch {
    }
  }

  async function refreshLogs(): Promise<void> {
    try {
      const res = await fetch('/__odx__/logs')
      if (res.ok) {
        const data = (await res.json()) as ODataLog[]
        // Only update if number of logs changed or it was empty
        if (data.length !== logs.value.length || logs.value.length === 0) {
          logs.value = data
        }
      }
    }
    catch {
    }
  }

  async function generateService(name: string): Promise<void> {
    generatingStatus.value[name] = true
    const start = Date.now()
    try {
      const res = await fetch(`/__odx__/generate?service=${name}`)

      let data: any
      const text = await res.text()
      try {
        data = JSON.parse(text)
      }
      catch {
        throw new Error(`Server returned invalid response: ${text.slice(0, 100)}...`)
      }

      if (!res.ok) {
        throw new Error(data.statusMessage || data.message || `Generation failed with status ${res.status}`)
      }

      const elapsed = Date.now() - start
      if (elapsed < 800) {
        await new Promise(resolve => setTimeout(resolve, 800 - elapsed))
      }

      if (data.success) {
        initializedServices.value.delete(name)
        schemaFocusedServices.value.delete(name)
        // Clear entity cache for this service
        for (const key in entityDataCache.value) {
          if (key.startsWith(`${name}:`)) {
            delete entityDataCache.value[key]
          }
        }
        await fetchConfig()
      }
    }
    catch (err: any) {
      console.error('[@bc8-odx/explorer] Generate failed:', err)
      throw err
    }
    finally {
      generatingStatus.value[name] = false
    }
  }

  async function clearLogs(): Promise<void> {
    try {
      await fetch('/__odx__/logs', { method: 'DELETE' })
      logs.value = []
    }
    catch {
    }
  }

  async function clearEntityMockData(service: string, entitySet: string): Promise<void> {
    try {
      await fetch(`/__odx__/mockdata?service=${service}&entitySet=${entitySet}`, { method: 'DELETE' })
    }
    catch {
    }
  }

  const services = computed(() => config.value.services || [])

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
    useCORSBridge,
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
    clearLogs,
    clearEntityMockData,
  }
}
