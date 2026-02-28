import { computed, ref } from 'vue'

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

const initializedServices = ref<Set<string>>(new Set())
const schemaFocusedServices = ref<Set<string>>(new Set())
const lastSelectedServiceForGraph = ref<string | null>(null)
const globalViewMode = ref<'explorer' | 'schema'>('explorer')

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
        logs.value = (await res.json()) as ODataLog[]
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
