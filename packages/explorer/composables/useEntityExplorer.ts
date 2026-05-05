import type { EntityMapping } from '@bc8-odx/core'
import type { EditorState } from './useODataState'
import { flattenOData } from '@bc8-odx/core'
import { buildEntityPreviewCacheKey } from './useODataState'

const editor = ref<EditorState>({
  show: false,
  mode: 'view',
  json: '',
  loading: false,
  error: null,
  original: null,
})

const showLoadingIndicator = ref(false)
const RE_TRAILING_SLASH = /\/$/
const RE_ODATA_NUMERIC_TYPE = /(?:^|\.)(?:Byte|SByte|Int16|Int32|Int64|Decimal|Double|Single)$/
const RE_NUMERIC_LITERAL = /^[+-]?(?:\d+|\d*\.\d+)(?:e[+-]?\d+)?$/i
const RE_SINGLE_QUOTE = /'/g
const RE_QUERY_SEPARATOR_CHARS = /[&#]/g

export interface EntityExplorer {
  selectedService: Ref<any>
  selectedEntity: Ref<string | null>
  previewLoading: Ref<boolean>
  showLoadingIndicator: Ref<boolean>
  previewError: Ref<string | null>
  previewData: Ref<Record<string, any>[] | null>
  queryInput: Ref<string>
  queryMethod: Ref<string>
  queryState: Ref<VisualQueryState>
  entitySchema: Ref<any>
  entitySchemaLoading: Ref<boolean>
  editor: Ref<EditorState>
  currentEntitySchema: ComputedRef<any>
  previewColumns: ComputedRef<string[]>
  navigationItems: ComputedRef<any[]>
  refreshEntityData: () => Promise<void>
  resetQuery: () => void
  isNavigationProperty: (key: string) => boolean
  openEditor: (mode: 'view' | 'create' | 'update' | 'headers', row?: any) => void
  deleteItem: (id: any) => Promise<void>
  clearData: () => Promise<void>
  downloadJson: () => void
}

export function useEntityExplorer(): EntityExplorer {
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
    queryMethod,
    queryState,
    useCORSBridge,
    entitySchema,
    entitySchemaLoading,
    entityDataCache,
  } = useSharedODataState()

  let loadingTimeout: ReturnType<typeof setTimeout> | null = null

  function getCurrentEntitySchema(): any {
    const entityName = selectedEntity.value
    if (!entitySchema.value || !entityName) {
      return null
    }

    const entities = entitySchema.value.entities || []
    return entities.find((e: any) =>
      e.name === entityName || e.entitySet === entityName,
    ) || entities.find((e: any) =>
      e.name.toLowerCase() === entityName.toLowerCase(),
    ) || entities.find((e: any) =>
      entityName.toLowerCase().startsWith(e.name.toLowerCase())
      || e.name.toLowerCase().startsWith(entityName.toLowerCase()),
    ) || null
  }

  function isNumericProperty(field: string): boolean {
    const propertyType = getCurrentEntitySchema()
      ?.properties
      ?.find((p: any) => p.name === field)
      ?.type
    return typeof propertyType === 'string' && RE_ODATA_NUMERIC_TYPE.test(propertyType)
  }

  function serializeStringLiteral(value: string): string {
    const escaped = value
      .replace(RE_SINGLE_QUOTE, '\'\'')
      .replace(RE_QUERY_SEPARATOR_CHARS, char => encodeURIComponent(char))
    return `'${escaped}'`
  }

  function serializeFilterValue(rule: any, forceStringLiteral = false): string {
    const value = rule.value
    if (typeof value === 'string') {
      const trimmed = value.trim()
      if (!forceStringLiteral && isNumericProperty(rule.field) && RE_NUMERIC_LITERAL.test(trimmed)) {
        return trimmed
      }
      return serializeStringLiteral(value)
    }
    return String(value)
  }

  // Watch queryState and generate queryInput string
  watch(queryState, (newState) => {
    let q = '?'
    const parts: string[] = []

    // 1. $select
    if (newState.select && newState.select.length > 0) {
      parts.push(`$select=${newState.select.join(',')}`)
    }

    // 2. $expand
    if (newState.expand && newState.expand.length > 0) {
      parts.push(`$expand=${newState.expand.join(',')}`)
    }

    // 3. $filter (Recursive)
    function serializeRule(rule: any): string {
      const isFunctionFilter = rule.operator === 'contains' || rule.operator === 'startswith' || rule.operator === 'endswith'
      const val = serializeFilterValue(rule, isFunctionFilter)
      if (isFunctionFilter) {
        return `${rule.operator}(${rule.field},${val})`
      }
      return `${rule.field} ${rule.operator} ${val}`
    }

    function serializeGroup(group: any): string {
      if (!group.items || group.items.length === 0)
        return ''

      const filterParts = group.items.map((item: any) => {
        if (item.type === 'group') {
          const subGroup = serializeGroup(item)
          return subGroup ? `(${subGroup})` : ''
        }
        return serializeRule(item)
      }).filter(Boolean)

      if (filterParts.length === 0)
        return ''
      return filterParts.join(` ${group.logic} `)
    }

    const filterString = serializeGroup(newState.filters)
    if (filterString) {
      parts.push(`$filter=${filterString}`)
    }

    // 4. $orderby
    if (newState.sortBy && newState.sortBy.length > 0) {
      const orderParts = newState.sortBy
        .filter(s => s.field)
        .map(s => `${s.field} ${s.direction}`)
      parts.push(`$orderby=${orderParts.join(',')}`)
    }

    // 5. $top / $skip
    if (newState.top !== null && newState.top !== undefined) {
      parts.push(`$top=${newState.top}`)
    }
    if (newState.skip !== null && newState.skip !== undefined) {
      parts.push(`$skip=${newState.skip}`)
    }

    q += parts.join('&')
    if (q === '?')
      q = '?'

    queryInput.value = q
  }, { deep: true })

  function resetQuery(): void {
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
    queryInput.value = '?'
  }

  // Loading indicator local logic: debounce showing the overlay to prevent flickering on fast requests
  watch([previewLoading, entitySchemaLoading], ([pLoading, eLoading]) => {
    const isLoading = pLoading || eLoading

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

    const { updateServiceHealth } = useSharedODataState()
    const svcName = selectedService.value.name

    previewLoading.value = true
    previewError.value = null
    try {
      const isDirect = selectedService.value.strategy === 'direct'
      let urlPath = ''

      if (isDirect && !useCORSBridge.value) {
        // True Direct Mode: Browser -> OData Service (Only if user explicitly opted-out of bridge)
        const baseUrl = selectedService.value.url?.replace(RE_TRAILING_SLASH, '')
        urlPath = `${baseUrl}/${selectedEntity.value}`
      }
      else {
        // Proxied Mode: Browser -> Nitro -> OData Service
        // This is the default even for 'direct' services to avoid CORS issues in dev.
        const route = selectedService.value.route || selectedService.value.name.toLowerCase()
        urlPath = `${config.value.basePath}/${route}/${selectedEntity.value}`
      }

      if (queryInput.value && queryInput.value !== '?') {
        const q = queryInput.value.startsWith('?') ? queryInput.value : `?${queryInput.value}`
        urlPath += q
      }

      const res = await fetch(urlPath, {
        method: queryMethod.value,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...sessionHeaders.value,
        },
      })
      if (!res.ok) {
        const errorText = await res.text().catch(() => '')
        let statusMessage = res.statusText || `Server Error ${res.status}`
        // If the body is parseable JSON the upstream service responded — only an empty
        // or non-JSON body on a 5xx means the proxy itself couldn't reach the service.
        let upstreamResponded = false
        try {
          const errData = JSON.parse(errorText)
          upstreamResponded = true
          // SAP OData: { error: { code, message } } — may be top-level or wrapped in
          // h3's { data: { error: { ... } } } when coming through proxy buffer mode.
          const sapError = errData.error ?? errData.data?.error
          if (sapError?.message) {
            statusMessage = sapError.message
          }
          else {
            statusMessage = errData.message || errData.statusMessage || errData.data?.statusMessage || statusMessage
          }
        }
        catch {
          if (errorText && errorText.length < 200) {
            statusMessage = errorText || statusMessage
          }
        }

        if (res.status >= 500 && !upstreamResponded) {
          updateServiceHealth(svcName, 'offline')
        }

        throw new Error(statusMessage)
      }

      updateServiceHealth(svcName, 'online')
      const responseText = await res.text()
      let data: any
      try {
        data = JSON.parse(responseText)
      }
      catch {
        data = { response: responseText }
      }

      // For non-GET requests (POST, PUT, PATCH, DELETE), we show the response in the editor
      if (queryMethod.value !== 'GET') {
        editor.value = {
          show: true,
          mode: 'response',
          json: typeof data === 'string' ? data : JSON.stringify(data, null, 2),
          loading: false,
          error: null,
          original: null,
        }
        previewLoading.value = false
        return
      }

      const finalData = flattenOData(data)
      const dataArray = Array.isArray(finalData) ? finalData : (finalData ? [finalData] : [])
      previewData.value = dataArray

      // Update cache
      const cacheKey = buildEntityPreviewCacheKey(selectedService.value.name, selectedEntity.value)
      entityDataCache.value[cacheKey] = {
        data: [...dataArray],
        error: null,
        query: queryInput.value,
        method: queryMethod.value,
        queryState: JSON.parse(JSON.stringify(queryState.value)),
      }
    }
    catch (e: unknown) {
      const msg = (e as Error).message
      previewError.value = msg
      previewData.value = []

      // Cache the error state too
      if (selectedService.value && selectedEntity.value) {
        const cacheKey = buildEntityPreviewCacheKey(selectedService.value.name, selectedEntity.value)
        entityDataCache.value[cacheKey] = {
          data: [],
          error: msg,
          query: queryInput.value,
          method: queryMethod.value,
          queryState: JSON.parse(JSON.stringify(queryState.value)),
        }
      }
    }
    finally {
      previewLoading.value = false
    }
  }

  const currentEntitySchema = computed(() => {
    return getCurrentEntitySchema()
  })

  const previewColumns = computed(() => {
    const edmxEntity = currentEntitySchema.value

    if (!edmxEntity) {
      if (previewData.value && previewData.value.length > 0) {
        return Object.keys(previewData.value[0] || {}).filter(k => k !== '__metadata')
      }
      return []
    }

    const edmxProps = edmxEntity.properties?.map((p: any) => p.name) || []
    const edmxNavProps = edmxEntity.navigationProperties?.map((np: any) => np.name) || []

    const combined = [...new Set([...edmxProps, ...edmxNavProps])]

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
        const toast = useToast()
        toast.add({
          title: `Item ${id} deleted successfully`,
          icon: 'i-lucide-circle-check',
          color: 'success',
        })
        await refreshEntityData()
      }
    }
    catch (e: unknown) {
      const toast = useToast()
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
      const toast = useToast()
      toast.add({
        title: `All mock data for ${selectedEntity.value} cleared`,
        icon: 'i-lucide-trash-2',
        color: 'success',
      })
      await refreshEntityData()
    }
    catch (e: unknown) {
      const toast = useToast()
      toast.add({
        title: (e as Error).message,
        icon: 'i-lucide-circle-x',
        color: 'error',
      })
    }
  }

  function downloadJson(): void {
    if (!previewData.value || previewData.value.length === 0) {
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
        value: entity.name,
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
    queryMethod,
    entitySchema,
    entitySchemaLoading,
    editor,
    currentEntitySchema,
    previewColumns,
    navigationItems,
    refreshEntityData,
    resetQuery,
    isNavigationProperty,
    openEditor,
    deleteItem,
    clearData,
    downloadJson,
    queryState,
  }
}
