import { ref, computed, getCurrentInstance, onBeforeUnmount } from 'vue'

export interface SapService {
  name: string
  route?: string
  entities?: string[]
  isGenerated?: boolean
}

export interface SapConfig {
  basePath: string
  mode: string
  services: SapService[]
  forwardAuthHeader: boolean
  versions: { node: string, module: string }
}

const config = ref<SapConfig>({
  basePath: '/api/sap-odata',
  mode: 'sdk',
  services: [],
  forwardAuthHeader: true,
  versions: { node: '', module: '1.0.0' },
})
const activeTab = ref('services')
const logs = ref<any[]>([])
const selectedService = ref<SapService | null>(null)
const selectedEntity = ref<string | null>(null)
const generatingStatus = ref<Record<string, boolean>>({})

export function useSharedODataState() {
  async function fetchConfig() {
    try {
      const res = await fetch('/__sap_odata__/config')
      const data = (await res.json()) as SapConfig
      config.value = data
      if (selectedService.value) {
        const updated = data.services.find((s) => s.name === selectedService.value?.name)
        if (updated) {
          selectedService.value = updated
        }
      }
    } catch { /* ignore */ }
  }

  async function refreshLogs() {
    try {
      const res = await fetch('/__sap_odata__/logs')
      if (res.ok) {
        logs.value = (await res.json()) as any[]
      }
    } catch { /* ignore */ }
  }

  async function generateService(name: string) {
    generatingStatus.value[name] = true
    try {
      const res = await fetch(`/__sap_odata__/generate?service=${name}`)
      const data = (await res.json()) as { success: boolean }
      if (data.success) {
        await fetchConfig()
      }
    } finally {
      generatingStatus.value[name] = false
    }
  }

  async function clearLogs() {
    try {
      await fetch('/__sap_odata__/logs', { method: 'DELETE' })
      logs.value = []
    } catch { /* ignore */ }
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
    fetchConfig,
    refreshLogs,
    generateService,
    clearLogs
  }
}
