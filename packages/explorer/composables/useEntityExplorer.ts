import type { EditorState, EntityMapping } from './useODataState'
import { computed, ref, watch } from 'vue'
import { useSharedODataState } from './useODataState'

const editor = ref<EditorState>({
  show: false,
  mode: 'view',
  json: '',
  loading: false,
  error: null,
  original: null,
})

const showLoadingIndicator = ref(false)

export function useEntityExplorer(): any {
  const {
    selectedService,
    selectedEntity,
    config,
    clearEntityMockData,
    sessionHeaders,
    previewLoading,
    previewError,
    previewData,
    queryInput,
    entitySchema,
    entitySchemaLoading,
    entityDataCache,
  } = useSharedODataState()

  const toast = useToast()

  let loadingTimeout: ReturnType<typeof setTimeout> | null = null

  // Loading indicator local logic
  watch(previewLoading, (isLoading: boolean) => {
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

      let finalData = []
      if (Array.isArray(data)) {
        finalData = data
      }
      else if (data && typeof data === 'object') {
        finalData = data.value || data.results || [data]
      }

      previewData.value = finalData

      // Update cache
      const cacheKey = `${selectedService.value.name}:${selectedEntity.value}`
      entityDataCache.value[cacheKey] = {
        data: [...finalData],
        error: null,
        query: queryInput.value,
      }
    }
    catch (e: unknown) {
      const msg = (e as Error).message
      previewError.value = msg
      previewData.value = []

      // Cache the error state too
      if (selectedService.value && selectedEntity.value) {
        const cacheKey = `${selectedService.value.name}:${selectedEntity.value}`
        entityDataCache.value[cacheKey] = {
          data: [],
          error: msg,
          query: queryInput.value,
        }
      }
    }
    finally {
      previewLoading.value = false
    }
  }

  const currentEntitySchema = computed(() => {
    const entityName = selectedEntity.value
    if (!entitySchema.value || !entityName) {
      return null
    }

    const exact = entitySchema.value.entities?.find((e: any) =>
      e.entitySet === entityName || e.name === entityName,
    )
    if (exact) {
      return exact
    }

    return entitySchema.value.entities?.find((e: any) =>
      entityName.toLowerCase().startsWith(e.name.toLowerCase())
      || e.name.toLowerCase().startsWith(entityName.toLowerCase())
      || (e.name.endsWith('y') && entityName.toLowerCase().startsWith(e.name.toLowerCase().slice(0, -1))),
    ) || null
  })

  const previewColumns = computed(() => {
    const edmxEntity = currentEntitySchema.value

    if (!edmxEntity) {
      if (previewData.value.length > 0) {
        return Object.keys(previewData.value[0] || {}).filter(k => k !== '__metadata')
      }
      return []
    }

    const edmxProps = edmxEntity.properties?.map((p: any) => p.name) || []
    const edmxNavProps = edmxEntity.navigationProperties?.map((np: any) => np.name) || []

    const combined = [...edmxProps, ...edmxNavProps]

    return combined.filter((col) => {
      const isTechnicalFK = (entitySchema.value?.associations || []).some((assoc: any) => {
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

    // eslint-disable-next-line no-alert
    if (!confirm(`Delete item ${id}?`)) {
      return
    }
    try {
      const route = selectedService.value.route || selectedService.value.name.toLowerCase()
      const res = await fetch(`${config.value.basePath}/${route}/${selectedEntity.value}?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.add({
          title: `Item ${id} deleted successfully`,
          icon: 'i-lucide-circle-check',
          color: 'success',
        })
        await refreshEntityData()
      }
    }
    catch (e: unknown) {
      toast.add({
        title: (e as Error).message,
        icon: 'i-lucide-circle-x',
        color: 'error',
      })
    }
  }

  async function clearData(): Promise<void> {
    if (!selectedService.value || !selectedEntity.value) {
      return
    }

    // eslint-disable-next-line no-alert
    if (!confirm(`Are you sure you want to clear all mock data for ${selectedEntity.value}?`)) {
      return
    }

    try {
      await clearEntityMockData(selectedService.value.name, selectedEntity.value)
      toast.add({
        title: `All mock data for ${selectedEntity.value} cleared`,
        icon: 'i-lucide-trash-2',
        color: 'success',
      })
      await refreshEntityData()
    }
    catch (e: unknown) {
      toast.add({
        title: (e as Error).message,
        icon: 'i-lucide-circle-x',
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
    entitySchema,
    entitySchemaLoading,
    editor,
    currentEntitySchema,
    previewColumns,
    navigationItems,
    refreshEntityData,
    isNavigationProperty,
    openEditor,
    deleteItem,
    clearData,
    downloadJson,
  }
}
