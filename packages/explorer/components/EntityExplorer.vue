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
  <div class="flex-1 flex flex-col overflow-hidden px-6">
    <div class="flex items-center border-b border-gray-200 dark:border-gray-800 mb-4 shrink-0 pr-1">
      <div class="flex gap-4 overflow-x-auto custom-scrollbar pb-px pr-4">
        <button
          v-for="entity in (selectedService?.entities || [])"
          :key="entity.name"
          class="text-[11px] font-bold font-mono px-1 py-2 border-b-2 transition-all bg-transparent cursor-pointer relative whitespace-nowrap"
          :class="selectedEntity === entity.name ? 'text-primary border-primary' : 'text-gray-500 border-transparent hover:text-gray-900 dark:hover:text-white'"
          @click="selectEntity(entity.name)"
        >
          {{ entity.name }}
        </button>
      </div>
    </div>

    <div
      v-if="selectedEntity"
      class="flex-1 flex flex-col min-h-0 bg-white dark:bg-[#0a0a0a] rounded-t-xl overflow-hidden border-t border-x border-gray-200 dark:border-gray-800 shadow-sm"
    >
      <div class="p-3 pr-4 flex items-end gap-4 bg-gray-50 dark:bg-[#0a0a0a] shrink-0 font-sans border-b border-gray-200 dark:border-gray-800">
        <div class="flex flex-col gap-1 flex-1">
          <label class="text-[9px] uppercase font-bold text-gray-600 dark:text-gray-400 tracking-widest ml-1 opacity-70 mb-1">
            OData Request Query
          </label>
          <UInput
            v-model="queryInput"
            placeholder="?id=... or ?$filter=..."
            size="sm"
            color="neutral"
            variant="outline"
            class="font-mono text-[11px]"
            @keyup.enter="refreshEntityData"
          />
        </div>
        <UButton
          label="Run"
          icon="i-heroicons-play"
          color="neutral"
          variant="subtle"
          size="sm"
          class="uppercase text-[10px] font-bold"
          @click="refreshEntityData"
        />
      </div>

      <div class="py-2 pl-4 pr-4 flex items-center justify-between bg-gray-50 dark:bg-[#0a0a0a] border-b border-gray-200 dark:border-gray-800 shrink-0">
        <div class="flex items-center gap-2">
          <span
            v-if="previewData.length > 0"
            class="text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest"
          >
            Items ({{ previewData.length }})
          </span>
          <div class="flex items-center gap-1 ml-2">
            <UButton
              label="Headers"
              icon="i-heroicons-adjustments-horizontal"
              color="neutral"
              variant="ghost"
              size="xs"
              class="text-[10px] uppercase font-bold"
              @click="openEditor('headers')"
            />
            <template v-if="previewData.length > 0">
              <UButton
                label="JSON"
                icon="i-heroicons-arrow-down-tray"
                color="neutral"
                variant="ghost"
                size="xs"
                class="text-[10px] uppercase font-bold"
                @click="downloadJson"
              />
              <UButton
                label="Clear"
                icon="i-heroicons-trash"
                color="error"
                variant="ghost"
                size="xs"
                class="text-[10px] uppercase font-bold"
                @click="clearData"
              />
            </template>
          </div>
        </div>
        <UButton
          label="Create Item"
          icon="i-heroicons-plus"
          color="neutral"
          variant="subtle"
          size="sm"
          class="uppercase text-[10px] font-bold"
          @click="openEditor('create')"
        />
      </div>

      <div class="flex-1 overflow-auto custom-scrollbar bg-white dark:bg-[#050505] relative">
        <div
          v-if="showLoadingIndicator"
          class="absolute inset-0 z-20 flex items-center justify-center bg-white/50 dark:bg-[#0c0c0d]/50 backdrop-blur-[1px]"
        >
          <UIcon name="i-heroicons-arrow-path" class="animate-spin w-8 h-8 text-primary" />
        </div>

        <div
          v-if="previewError"
          class="p-16 flex flex-col items-center justify-center text-center"
        >
          <div class="w-14 h-14 rounded-full bg-error-500/10 flex items-center justify-center mb-6">
            <UIcon name="i-heroicons-exclamation-triangle" class="text-error-500 w-7 h-7" />
          </div>
          <h3 class="text-xs font-bold text-error-500 uppercase tracking-widest mb-3">
            OData Request Failed
          </h3>
          <p class="text-[12px] text-gray-500 dark:text-gray-400 font-mono mb-6 max-w-lg leading-relaxed">
            {{ previewError }}
          </p>
          <UButton
            label="Retry Request"
            color="neutral"
            variant="link"
            size="sm"
            class="text-[10px] font-bold uppercase tracking-wider underline underline-offset-4"
            @click="refreshEntityData"
          />
        </div>

        <template v-else>
          <table
            class="w-full text-left text-[11px] border-separate border-spacing-0 min-w-max"
            :class="{ 'opacity-50 pointer-events-none transition-opacity duration-300': previewLoading && !showLoadingIndicator }"
          >
            <thead class="sticky top-0 z-10">
              <tr class="text-gray-800 dark:text-gray-200 text-[9px] font-black tracking-wide">
                <th class="px-4 py-3 w-28 text-center border-r border-b border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-sm font-bold uppercase text-[9px]">
                  Actions
                </th>
                <th
                  v-for="key in previewColumns"
                  :key="key"
                  class="px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-sm font-bold normal-case text-[10px] opacity-80"
                >
                  {{ key }}
                </th>
              </tr>
            </thead>
            <tbody v-if="previewData.length > 0" class="divide-y border-gray-200 dark:border-gray-800 font-mono text-[11px]">
              <tr
                v-for="(row, idx) in previewData"
                :key="idx"
                class="hover:bg-primary-500/10 transition-colors"
              >
                <td class="p-0 border-r border-gray-200 dark:border-gray-800 align-middle">
                  <div class="flex items-center justify-center gap-2">
                    <UButton
                      icon="i-heroicons-eye"
                      color="neutral"
                      variant="ghost"
                      size="xs"
                      title="View"
                      @click="openEditor('view', row)"
                    />
                    <UButton
                      icon="i-heroicons-pencil"
                      color="neutral"
                      variant="ghost"
                      size="xs"
                      title="Edit"
                      @click="openEditor('update', row)"
                    />
                    <UButton
                      icon="i-heroicons-trash"
                      color="error"
                      variant="ghost"
                      size="xs"
                      title="Delete"
                      @click="deleteItem(row)"
                    />
                  </div>
                </td>
                <td
                  v-for="key in previewColumns"
                  :key="key"
                  class="px-4 py-2.5 truncate max-w-[300px] opacity-90 text-gray-900 dark:text-gray-100"
                >
                  <template v-if="Array.isArray(row[key])">
                    <UButton
                      :label="`${(row[key] as any[]).length} Items`"
                      color="primary"
                      variant="subtle"
                      size="xs"
                      class="text-[10px] font-bold"
                      @click.stop="openEditor('view', row[key] as any)"
                    />
                  </template>
                  <template v-else-if="row[key] && typeof row[key] === 'object'">
                    <UButton
                      label="Object"
                      color="neutral"
                      variant="subtle"
                      size="xs"
                      class="text-[10px] font-bold"
                      @click.stop="openEditor('view', row[key] as any)"
                    />
                  </template>
                  <template v-else-if="row[key] === null">
                    <template v-if="isNavigationProperty(key as string)">
                      <span class="text-[9px] opacity-30 italic font-sans">Not expanded</span>
                    </template>
                    <template v-else>
                      <span class="opacity-20">-</span>
                    </template>
                  </template>
                  <template v-else>
                    {{ row[key] }}
                  </template>
                </td>
              </tr>
            </tbody>
          </table>

          <div
            v-if="previewData.length === 0 && !previewLoading"
            class="p-20 flex flex-col items-center justify-center text-center opacity-40 italic space-y-2"
          >
            <UIcon name="i-heroicons-magnifying-glass" class="w-8 h-8" />
            <p class="text-xs">
              No items found for this query
            </p>
          </div>
          <div v-else-if="previewLoading && showLoadingIndicator" class="p-20 flex justify-center opacity-30">
            <UIcon name="i-heroicons-arrow-path" class="animate-spin w-8 h-8" />
          </div>
        </template>
      </div>
    </div>

    <div
      v-else
      class="flex-1 flex flex-col items-center justify-center text-center p-12 bg-gray-500/5 rounded-t-xl border-t border-x border-gray-200 dark:border-gray-800 border-dashed"
    >
      <div class="w-16 h-16 rounded-2xl bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-800 flex items-center justify-center mb-6 shadow-sm">
        <UIcon name="i-heroicons-magnifying-glass-circle" class="text-gray-400 w-8 h-8" />
      </div>
      <h3 class="text-sm font-bold uppercase tracking-widest mb-2">
        Select an Entity
      </h3>
      <p class="text-[12px] text-gray-500 max-w-[280px] leading-relaxed">
        Choose one of the available entity sets above to explore, edit, or create OData records.
      </p>
    </div>

    <DataEditor
      v-model:editor="editor"
      @refresh="refreshEntityData"
    />
  </div>
</template>
