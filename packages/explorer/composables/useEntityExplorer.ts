import type { EditorState, EntityMapping } from './useODataState'
import { computed, ref, watch } from 'vue'
import { useSharedODataState } from './useODataState'

const previewLoading = ref(false)
const showLoadingIndicator = ref(false)
const previewError = ref<string | null>(null)
const previewData = ref<Record<string, any>[]>([])
const queryInput = ref('?')
const schema = ref<any>(null)
const editor = ref<EditorState>({
  show: false,
  mode: 'view',
  json: '',
  loading: false,
  error: null,
  original: null,
})

let initialized = false

export function useEntityExplorer(): any {
  const {
    selectedService,
    selectedEntity,
    config,
    clearEntityMockData,
    sessionHeaders,
  } = useSharedODataState()

  const toast = useToast()

  let loadingTimeout: ReturnType<typeof setTimeout> | null = null

  if (!initialized) {
    initialized = true

    watch(previewLoading, (isLoading) => {
      if (loadingTimeout) {
        clearTimeout(loadingTimeout)
      }

      if (isLoading) {
        loadingTimeout = setTimeout(() => {
          showLoadingIndicator.value = true
        }, 400)
      }
      else {
        showLoadingIndicator.value = false
      }
    })

    watch(selectedService, (newSvc) => {
      selectedEntity.value = null
      schema.value = null

      if (newSvc) {
        fetchSchema()
      }
    }, { immediate: true })

    watch(selectedEntity, (newEntity) => {
      if (newEntity) {
        refreshEntityData()
      }
    }, { immediate: true })
  }

  async function fetchSchema(): Promise<void> {
    if (!selectedService.value) {
      return
    }
    try {
      const res = await fetch(`/__sap_odata__/schema?service=${selectedService.value.name}`)
      if (!res.ok) {
        throw new Error(`Schema API returned ${res.status}: ${res.statusText}`)
      }
      const text = await res.text()
      if (!text) {
        throw new Error('Schema API returned an empty response')
      }
      schema.value = JSON.parse(text)
    }
    catch (e) {
      console.error('[nuxt-sap-odata] Failed to fetch schema:', e)
      schema.value = null
    }
  }

  async function refreshEntityData(): Promise<void> {
    if (!selectedService.value || !selectedEntity.value) {
      return
    }
    previewLoading.value = true
    previewError.value = null
    try {
      const route = selectedService.value.route || selectedService.value.name.toLowerCase()

      let urlPath = `${config.value.basePath}/${route}/${selectedEntity.value}`
      if (queryInput.value && queryInput.value !== '?') {
        const q = queryInput.value.startsWith('?') ? queryInput.value : `?${queryInput.value}`
        urlPath += q
      }

      const res = await fetch(urlPath, {
        headers: {
          'Content-Type': 'application/json',
          ...sessionHeaders.value,
        },
      })
      if (!res.ok) {
        const errorText = await res.text().catch(() => '')
        let statusMessage = res.statusText || `Server Error ${res.status}`
        try {
          const errData = JSON.parse(errorText)
          statusMessage = errData.message || errData.statusMessage || (errData.data && errData.data.statusMessage) || statusMessage
        }
        catch {
          if (errorText && errorText.length < 100) {
            statusMessage = errorText
          }
        }
        throw new Error(statusMessage)
      }
      const data = await res.json()
      previewData.value = (Array.isArray(data) ? data : (data.value || [data])) as Record<string, any>[]
    }
    catch (e: unknown) {
      previewError.value = (e as Error).message
      previewData.value = []
    }
    finally {
      previewLoading.value = false
    }
  }

  const currentEntitySchema = computed(() => {
    const entityName = selectedEntity.value
    if (!schema.value || !entityName) {
      return null
    }

    return schema.value.entities?.find((e: any) =>
      e.entitySet === entityName
      || e.name === entityName
      || entityName.toLowerCase().startsWith(e.name.toLowerCase())
      || e.name.toLowerCase().startsWith(entityName.toLowerCase())
      || (e.name.endsWith('y') && entityName.toLowerCase().startsWith(e.name.toLowerCase().slice(0, -1))),
    ) || null
  })

  const previewColumns = computed(() => {
    const edmxEntity = currentEntitySchema.value
    if (!edmxEntity) {
      return []
    }

    const edmxProps = edmxEntity.properties?.map((p: any) => p.name) || []
    const edmxNavProps = edmxEntity.navigationProperties?.map((np: any) => np.name) || []

    const combined = [...edmxProps, ...edmxNavProps]

    return combined.filter((col) => {
      const isTechnicalFK = (schema.value?.associations || []).some((assoc: any) => {
        return assoc.constraint?.dependentProperty === col
      })
      return !isTechnicalFK
    })
  })

  function isNavigationProperty(key: string): boolean {
    return (currentEntitySchema.value?.navigationProperties || []).some((np: any) =>
      np.name.toLowerCase() === key.toLowerCase(),
    )
  }

  function openEditor(mode: 'view' | 'create' | 'update' | 'headers', row: any = null): void {
    let initialJson = ''
    if (mode === 'headers') {
      const svcConfig = config.value.services?.find((s: any) => s.name === selectedService.value?.name)
      const combinedHeaders = {
        ...((svcConfig as any)?.headers || {}),
        ...sessionHeaders.value,
      }
      initialJson = JSON.stringify(combinedHeaders, null, 2)
    }
    else if (row) {
      initialJson = JSON.stringify(row, null, 2)
    }
    else if (mode === 'create' && currentEntitySchema.value) {
      const template: Record<string, any> = {}
      currentEntitySchema.value.properties?.forEach((p: any) => {
        if (p.type.includes('Int') || p.type.includes('Decimal') || p.type.includes('Double')) {
          template[p.name] = 0
        }
        else if (p.type.includes('Boolean')) {
          template[p.name] = false
        }
        else {
          template[p.name] = ''
        }
      })
      initialJson = JSON.stringify(template, null, 2)
    }
    else {
      initialJson = JSON.stringify({ ID: '', Name: '' }, null, 2)
    }

    editor.value = {
      show: true,
      mode,
      error: null,
      loading: false,
      original: row,
      json: initialJson,
    }
  }

  async function deleteItem(id: any): Promise<void> {
    if (!selectedService.value || !selectedEntity.value || !id) {
      return
    }

    /* eslint-disable no-alert */
    if (!confirm(`Delete item ${id}?`)) {
      return
    }
    try {
      const route = selectedService.value.route || selectedService.value.name.toLowerCase()
      const res = await fetch(`${config.value.basePath}/${route}/${selectedEntity.value}?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.add({
          title: `Item ${id} deleted successfully`,
          icon: 'i-heroicons-check-circle',
          color: 'success',
        })
        await refreshEntityData()
      }
    }
    catch (e: unknown) {
      toast.add({
        title: (e as Error).message,
        icon: 'i-heroicons-x-circle',
        color: 'error',
      })
    }
  }

  async function clearData(): Promise<void> {
    if (!selectedService.value || !selectedEntity.value) {
      return
    }

    if (!confirm(`Are you sure you want to clear all mock data for ${selectedEntity.value}?`)) {
      return
    }

    try {
      await clearEntityMockData(selectedService.value.name, selectedEntity.value)
      toast.add({
        title: `All mock data for ${selectedEntity.value} cleared`,
        icon: 'i-heroicons-trash',
        color: 'success',
      })
      await refreshEntityData()
    }
    catch (e: unknown) {
      toast.add({
        title: (e as Error).message,
        icon: 'i-heroicons-x-circle',
        color: 'error',
      })
    }
  }

  function downloadJson(): void {
    if (previewData.value.length === 0) {
      return
    }
    const blob = new Blob([JSON.stringify(previewData.value, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedEntity.value}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const navigationItems = computed(() => {
    if (!selectedService.value?.entities)
      return []

    return [
      selectedService.value.entities.map((entity: EntityMapping) => ({
        label: entity.name,
        active: selectedEntity.value === entity.name,
        onSelect: () => {
          selectedEntity.value = entity.name
          queryInput.value = '?'
        },
      })),
    ]
  })

  return {
    selectedService,
    selectedEntity,
    previewLoading,
    showLoadingIndicator,
    previewError,
    previewData,
    queryInput,
    schema,
    editor,
    currentEntitySchema,
    previewColumns,
    navigationItems,
    fetchSchema,
    refreshEntityData,
    isNavigationProperty,
    openEditor,
    deleteItem,
    clearData,
    downloadJson,
  }
}
