import { computed, ref, watch } from 'vue'

export interface EntityMapping {
  name: string
  type: string
}

export interface SapService {
  name: string
  route?: string
  entities?: EntityMapping[]
  isGenerated?: boolean
  version?: 'v2' | 'v4' | null
  strategy?: 'proxied' | 'direct'
}

export interface SapConfig {
  basePath: string
  mode: string
  services: SapService[]
  forwardAuthHeader: boolean
  versions: { node: string, module: string }
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
}

export interface EditorState {
  show: boolean
  mode: 'view' | 'create' | 'update' | 'headers'
  json: string
  loading: boolean
  error: string | null
  original: Record<string, unknown> | null
}

const config = ref<SapConfig>({
  basePath: '/api/sap-odata',
  mode: 'sdk',
  services: [],
  forwardAuthHeader: true,
  versions: { node: '', module: '1.0.0' },
})
const activeTab = ref('services')
const logs = ref<ODataLog[]>([])
const selectedService = ref<SapService | null>(null)
const selectedEntity = ref<string | null>(null)
const generatingStatus = ref<Record<string, boolean>>({})
const sessionHeaders = ref<Record<string, string>>({})

const previewLoading = ref(false)
const previewError = ref<string | null>(null)
const previewData = ref<Record<string, any>[]>([])
const queryInput = ref('?')
const entitySchema = ref<any>(null)
const entitySchemaLoading = ref(false)

// Per-entity cache for data and query state
const entityDataCache = ref<Record<string, { data: any[], error: string | null, query: string }>>({})

const initializedServices = ref<Set<string>>(new Set())
const schemaFocusedServices = ref<Set<string>>(new Set())
const lastSelectedServiceForGraph = ref<string | null>(null)
const globalViewMode = ref<'explorer' | 'schema'>('explorer')

// GLOBAL SYNC LOGIC (Persists across unmounts)

// 1. Service Change: Reset everything and fetch new schema
watch(selectedService, async (newSvc) => {
  selectedEntity.value = null
  previewData.value = []
  previewError.value = null
  queryInput.value = '?'
  entitySchema.value = null

  if (newSvc) {
    entitySchemaLoading.value = true
    try {
      const res = await fetch(`/__sap_odata__/schema?service=${newSvc.name}`)
      if (res.ok) {
        entitySchema.value = await res.json()
      }
    }
    catch (e) {
      console.error('[SharedState] Failed to fetch schema:', e)
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
    }
    else {
      previewData.value = []
      previewError.value = null
      queryInput.value = '?'
    }
  }
  else {
    previewData.value = []
    previewError.value = null
    queryInput.value = '?'
  }
})

export function useSharedODataState(): any {
  async function fetchConfig(): Promise<void> {
    try {
      const res = await fetch('/__sap_odata__/config')
      const data = (await res.json()) as SapConfig
      config.value = data
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
      const res = await fetch('/__sap_odata__/logs')
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
      const res = await fetch(`/__sap_odata__/generate?service=${name}`)

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
      console.error('[nuxt-sap-odata] Generate failed:', err)
    }
    finally {
      generatingStatus.value[name] = false
    }
  }

  async function clearLogs(): Promise<void> {
    try {
      await fetch('/__sap_odata__/logs', { method: 'DELETE' })
      logs.value = []
    }
    catch {
    }
  }

  async function clearEntityMockData(service: string, entitySet: string): Promise<void> {
    try {
      await fetch(`/__sap_odata__/mockdata?service=${service}&entitySet=${entitySet}`, { method: 'DELETE' })
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
    previewLoading,
    previewError,
    previewData,
    queryInput,
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
