<script setup lang="ts">
import type { EditorState } from '../composables/useODataState'
import { computed, onMounted, ref, watch } from 'vue'
import { useSharedODataState } from '../composables/useODataState'

const { selectedService, selectedEntity, config, clearEntityMockData, sessionHeaders } = useSharedODataState()
const toast = useToast()

const previewLoading = ref(false)
const showLoadingIndicator = ref(false)
const previewError = ref<string | null>(null)
const previewData = ref<Record<string, unknown>[]>([])
const queryInput = ref('?')
const schema = ref<any>(null)

let loadingTimeout: ReturnType<typeof setTimeout> | null = null

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

const editor = ref<EditorState>({
  show: false,
  mode: 'view',
  json: '',
  loading: false,
  error: null,
  original: null,
})

/**
 * Selects an entity and resets the query input.
 * @param entity The name of the entity to select.
 */
async function selectEntity(entity: string) {
  selectedEntity.value = entity
  queryInput.value = '?'
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

/**
 * Checks if a property is a navigation property.
 * @param key The property name.
 */
function isNavigationProperty(key: string) {
  return currentEntitySchema.value?.navigationProperties?.some((np: any) =>
    np.name.toLowerCase() === key.toLowerCase(),
  )
}

const previewColumns = computed(() => {
  const edmxEntity = currentEntitySchema.value
  if (!edmxEntity) {
    return []
  }

  const edmxProps = edmxEntity.properties?.map((p: any) => p.name) || []
  const edmxNavProps = edmxEntity.navigationProperties?.map((np: any) => np.name) || []

  const combined = [...edmxProps, ...edmxNavProps]

  return combined.filter((col) => {
    const isTechnicalFK = schema.value?.associations?.some((assoc: any) => {
      return assoc.constraint?.dependentProperty === col
    })
    return !isTechnicalFK
  })
})

/**
 * Fetches the OData schema for the selected service.
 */
async function fetchSchema() {
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

/**
 * Refreshes the data for the selected entity.
 */
async function refreshEntityData() {
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
    previewData.value = (Array.isArray(data) ? data : (data.value || [data])) as Record<string, unknown>[]
  }
  catch (e: unknown) {
    previewError.value = (e as Error).message
    previewData.value = []
  }
  finally {
    previewLoading.value = false
  }
}

/**
 * Opens the JSON editor for various modes.
 * @param mode The editor mode.
 * @param row The data row to edit or view.
 */
function openEditor(mode: 'view' | 'create' | 'update' | 'headers', row: Record<string, unknown> | null = null) {
  let initialJson = ''
  if (mode === 'headers') {
    const svcConfig = config.value.services?.find(s => s.name === selectedService.value?.name)
    const combinedHeaders = {
      ...(svcConfig as any)?.headers,
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

/**
 * Deletes a single item.
 * @param row The row to delete.
 */
async function deleteItem(row: Record<string, unknown>) {
  if (!selectedService.value || !selectedEntity.value) {
    return
  }
  const idKey = Object.keys(row).find(k => k.toLowerCase() === 'id')
  const id = idKey ? row[idKey] : null

  if (!id || !window.confirm(`Delete item ${id}?`)) {
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

/**
 * Clears all mock data for the entity.
 */
async function clearData() {
  if (!selectedService.value || !selectedEntity.value) {
    return
  }

  if (!window.confirm(`Are you sure you want to clear all mock data for ${selectedEntity.value}? This cannot be undone.`)) {
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

/**
 * Downloads the current preview data as a JSON file.
 */
function downloadJson() {
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

onMounted(() => {
  if (selectedService.value) {
    fetchSchema()
  }
})
</script>

<template>
  <div class="h-full flex flex-col overflow-hidden bg-white dark:bg-black">
    <!-- Entity Select -->
    <div class="px-6 py-2 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-zinc-900/50">
      <div class="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
        <UButton
          v-for="entity in (selectedService?.entities || [])"
          :key="entity.name"
          :label="entity.name"
          :color="selectedEntity === entity.name ? 'primary' : 'neutral'"
          :variant="selectedEntity === entity.name ? 'soft' : 'ghost'"
          size="xs"
          class="font-mono font-bold"
          @click="selectEntity(entity.name)"
        />
      </div>
    </div>

    <!-- Data View -->
    <div
      v-if="selectedEntity"
      class="flex-1 flex flex-col min-h-0 relative"
    >
      <!-- Query Toolbar -->
      <div class="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-4 shrink-0 bg-white dark:bg-zinc-900/20">
        <UInput
          v-model="queryInput"
          placeholder="?id=... or ?$filter=..."
          icon="i-heroicons-magnifying-glass"
          class="flex-1 font-mono text-xs"
          size="sm"
          @keyup.enter="refreshEntityData"
        >
          <template #trailing>
            <UKbd>Enter</UKbd>
          </template>
        </UInput>
        <UButton
          label="Execute"
          icon="i-heroicons-play"
          color="primary"
          size="sm"
          @click="refreshEntityData"
        />
      </div>

      <!-- Action Bar -->
      <div class="px-6 py-2 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between shrink-0 bg-gray-50/30 dark:bg-zinc-950/30">
        <div class="flex items-center gap-4">
          <span class="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
            {{ previewData.length }} Results
          </span>
          <div class="flex items-center gap-1">
            <UButton label="Headers" icon="i-heroicons-adjustments-horizontal" variant="ghost" color="neutral" size="xs" @click="openEditor('headers')" />
            <template v-if="previewData.length > 0">
              <UButton label="JSON" icon="i-heroicons-arrow-down-tray" variant="ghost" color="neutral" size="xs" @click="downloadJson" />
              <UButton label="Clear" icon="i-heroicons-trash" variant="ghost" color="error" size="xs" @click="clearData" />
            </template>
          </div>
        </div>
        <UButton
          label="New Record"
          icon="i-heroicons-plus"
          variant="outline"
          color="neutral"
          size="xs"
          @click="openEditor('create')"
        />
      </div>

      <!-- Table Content -->
      <div class="flex-1 overflow-auto custom-scrollbar relative bg-white dark:bg-black">
        <div
          v-if="showLoadingIndicator"
          class="absolute inset-0 z-20 flex items-center justify-center bg-white/50 dark:bg-black/50 backdrop-blur-[1px]"
        >
          <UIcon name="i-heroicons-arrow-path" class="animate-spin w-8 h-8 text-primary" />
        </div>

        <div
          v-if="previewError"
          class="p-16 flex flex-col items-center justify-center text-center"
        >
          <UIcon name="i-heroicons-exclamation-triangle" class="text-error-500 w-12 h-12 mb-4" />
          <h3 class="text-lg font-bold mb-2 text-neutral-900 dark:text-neutral-100">Request Failed</h3>
          <p class="text-sm text-neutral-500 font-mono mb-6 max-w-lg">{{ previewError }}</p>
          <UButton label="Retry" color="neutral" variant="soft" @click="refreshEntityData" />
        </div>

        <template v-else>
          <UTable
            :columns="previewColumns.map(c => ({ key: c, label: c }))"
            :rows="previewData"
            class="min-w-max"
            :ui="{ thead: 'bg-gray-50/50 dark:bg-zinc-900/50', th: 'text-[10px] uppercase tracking-wider' }"
          >
            <!-- Actions Column -->
            <template #actions-header>
              <div class="text-center w-24">Actions</div>
            </template>
            <template #actions-data="{ row }">
              <div class="flex items-center justify-center gap-1">
                <UButton icon="i-heroicons-eye" variant="ghost" color="neutral" size="xs" @click="openEditor('view', row)" />
                <UButton icon="i-heroicons-pencil" variant="ghost" color="neutral" size="xs" @click="openEditor('update', row)" />
                <UButton icon="i-heroicons-trash" variant="ghost" color="error" size="xs" @click="deleteItem(row)" />
              </div>
            </template>

            <!-- Custom Cell Rendering -->
            <template v-for="key in previewColumns" :key="key" #[`${key}-data`]="{ row }">
              <template v-if="Array.isArray(row[key])">
                <UButton :label="`${(row[key] as any[]).length} Items`" variant="soft" color="primary" size="xs" @click.stop="openEditor('view', row[key] as any)" />
              </template>
              <template v-else-if="row[key] && typeof row[key] === 'object'">
                <UButton label="Object" variant="soft" color="neutral" size="xs" @click.stop="openEditor('view', row[key] as any)" />
              </template>
              <template v-else-if="row[key] === null">
                <span class="opacity-20 italic text-xs">{{ isNavigationProperty(key as string) ? 'not expanded' : '-' }}</span>
              </template>
              <template v-else>
                <span class="font-mono text-xs text-neutral-700 dark:text-neutral-300">{{ row[key] }}</span>
              </template>
            </template>
          </UTable>

          <div
            v-if="previewData.length === 0 && !previewLoading"
            class="p-20 flex flex-col items-center justify-center opacity-40 italic text-neutral-500"
          >
            <UIcon name="i-heroicons-magnifying-glass" class="w-8 h-8 mb-2" />
            <p>No records match your query</p>
          </div>
        </template>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else
      class="flex-1 flex flex-col items-center justify-center bg-gray-50/10 dark:bg-zinc-950/10"
    >
      <div class="text-center p-12 max-w-sm">
        <UIcon name="i-heroicons-magnifying-glass-circle" class="w-12 h-12 text-neutral-400 mb-4" />
        <h3 class="text-xl font-bold mb-2 text-neutral-900 dark:text-neutral-100">Explore Your Data</h3>
        <p class="text-neutral-500 text-sm">Select an entity set from the list above to start browsing and managing your OData records.</p>
      </div>
    </div>

    <DataEditor
      v-model:editor="editor"
      @refresh="refreshEntityData"
    />
  </div>
</template>
