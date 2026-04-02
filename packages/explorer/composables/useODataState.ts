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
  health?: 'online' | 'offline' | 'checking'
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
  status: number
  duration: number
  proxyTrace?: ProxyTraceEntry[]
}

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

// Global Singleton state
const activeTab = ref('overview')
const logs = ref<ODataLog[]>([])
const config = ref<ODataConfig>({ basePath: '/__odx__', services: [] })
const selectedService = ref<ODataServiceState | null>(null)
const selectedEntity = ref<string | null>(null)
const generatingStatus = ref<Record<string, boolean>>({})
const sessionHeaders = ref<Record<string, string>>({})
const logFilterService = ref<string | null>(null)
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
  clearLogs: () => Promise<void>
  clearEntityMockData: (service: string, entitySet: string) => Promise<void>
}

export function useSharedODataState(): SharedODataState {
  async function fetchConfig(): Promise<void> {
    try {
      const res = await fetch('/__odx__/config')
      if (res.ok) {
        config.value = await res.json()
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
      }
    }
    catch (e) {
      console.error('[ODataState] Failed to refresh logs', e)
    }
  }

  const services = computed(() => {
    const data = config.value.services || []
    return data.map((s: any) => {
      return {
        ...s,
        health: s.health || 'checking',
      }
    })
  })

  watch(config, (data) => {
    if (selectedService.value) {
      const currentService = selectedService.value
      const updated = data.services.find((s: any) => s.name === currentService.name)
      if (updated) {
        selectedService.value = updated
      }
    }
  }, { deep: true })

  async function generateService(name: string): Promise<void> {
    generatingStatus.value[name] = true
    try {
      await fetch(`/__odx__/generate?service=${name}`)
      await fetchConfig()
    }
    catch (e) {
      console.error(`[ODataState] Failed to generate types for ${name}`, e)
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
    catch (e) {
      console.error('[ODataState] Failed to clear logs', e)
    }
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
    clearLogs,
    clearEntityMockData,
  }
}

// Watch for selectedEntity changes to update the entitySchema
watch(selectedEntity, async (newEntity) => {
  if (!newEntity || !selectedService.value) {
    entitySchema.value = null
    return
  }

  entitySchemaLoading.value = true
  try {
    const res = await fetch(`/__odx__/schema?service=${selectedService.value.name}`)
    if (res.ok) {
      entitySchema.value = await res.json()
    }
  }
  catch (e) {
    console.error(`[ODataState] Failed to fetch schema for ${newEntity}`, e)
  }
  finally {
    entitySchemaLoading.value = false
  }
})
