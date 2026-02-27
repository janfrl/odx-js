<script setup lang="ts">
import type { EditorState } from '../composables/useODataState'
import { computed, onMounted, ref, watch } from 'vue'
import { useSharedODataState } from '../composables/useODataState'

const { selectedService, selectedEntity, config, clearEntityMockData, sessionHeaders } = useSharedODataState()
const toast = useToast()

const previewLoading = ref(false)
const showLoadingIndicator = ref(false)
const previewError = ref<string | null>(null)
const previewData = ref<Record<string, any>[]>([])
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

function getRowData(row: any): Record<string, any> {
  return row?.original || {}
}

async function selectEntity(entity: string) {
  selectedEntity.value = entity
  queryInput.value = '?'
}

const navigationItems = computed(() => {
  if (!selectedService.value?.entities)
    return []

  return [
    selectedService.value.entities.map(entity => ({
      label: entity.name,
      active: selectedEntity.value === entity.name,
      onSelect: () => selectEntity(entity.name),
    })),
  ]
})

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

function isNavigationProperty(key: string) {
  return (currentEntitySchema.value?.navigationProperties || []).some((np: any) =>
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
    const isTechnicalFK = (schema.value?.associations || []).some((assoc: any) => {
      return assoc.constraint?.dependentProperty === col
    })
    return !isTechnicalFK
  })
})

const tableColumns = computed<any[]>(() => {
  const cols = previewColumns.value || []
  return [
    {
      id: 'actions',
      header: 'Actions',
      size: 140,
      minSize: 140,
      maxSize: 140,
      class: 'sticky left-0 bg-gray-50 dark:bg-zinc-900 z-20 shadow-[1px_0_0_0_rgba(0,0,0,0.1)] dark:shadow-[1px_0_0_0_rgba(255,255,255,0.1)]',
    },
    ...cols.map(c => ({
      id: c,
      accessorKey: c,
      header: c,
    })),
  ]
})

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

function openEditor(mode: 'view' | 'create' | 'update' | 'headers', row: any = null) {
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

async function deleteItem(id: any) {
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

async function clearData() {
  if (!selectedService.value || !selectedEntity.value) {
    return
  }

  /* eslint-disable no-alert */
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
  <div class="h-full flex flex-col overflow-hidden font-sans bg-white dark:bg-black text-xs">
    <!-- Entity Navigation Menu -->
    <div class="px-4 border-b border-gray-200/70 dark:border-gray-800/70 bg-white/50 dark:bg-zinc-900 shrink-0">
      <UNavigationMenu
        :items="navigationItems"
        class="w-full"
      />
    </div>

    <!-- Main Wrapper -->
    <div
      class="flex-1 flex flex-col min-h-0 relative pt-4 px-4 pb-0 sm:pt-6 sm:px-6 sm:pb-0"
    >
      <!-- Empty State Unit (Refactored to match old favorite design) -->
      <div
        v-if="!selectedEntity"
        class="flex-1 flex flex-col items-center justify-center text-center p-12 bg-zinc-500/5 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-t-2xl transition-all"
      >
        <div class="w-16 h-16 rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-gray-800 flex items-center justify-center mb-6 shadow-sm">
          <UIcon name="i-heroicons-circle-stack" class="text-zinc-400 w-8 h-8" />
        </div>
        <h3 class="text-sm font-bold uppercase tracking-widest mb-2 text-neutral-900 dark:text-neutral-100">
          Select an Entity
        </h3>
        <p class="text-[12px] text-neutral-500 dark:text-neutral-400 max-w-[280px] leading-relaxed">
          Choose one of the available entity sets above to explore, edit, or create OData records.
        </p>
      </div>

      <!-- Unified Content Block -->
      <div
        v-else
        class="flex-1 flex flex-col min-h-0 overflow-hidden ring-1 ring-gray-200/70 dark:ring-gray-800/70 rounded-t-2xl bg-white dark:bg-zinc-900/50 shadow-2xl transition-all"
      >
        <!-- Toolbars -->
        <div class="flex flex-col shrink-0 bg-white dark:bg-zinc-950 rounded-t-[inherit] overflow-hidden">
          <!-- Query Area -->
          <div class="p-4 border-b border-gray-200/50 dark:border-gray-800/50 flex items-center gap-4 bg-white/80 dark:bg-zinc-900/40 backdrop-blur-md rounded-t-[inherit]">
            <UInput
              v-model="queryInput"
              placeholder="?id=... or ?$filter=..."
              icon="i-heroicons-magnifying-glass"
              class="flex-1 font-mono"
              size="md"
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
              size="md"
              class="px-4 font-bold"
              @click="refreshEntityData"
            />
          </div>

          <!-- Actions Area -->
          <div class="px-6 py-2 border-b border-gray-200/50 dark:border-gray-800/50 flex items-center justify-between bg-gray-50/50 dark:bg-zinc-900/20">
            <div class="flex items-center gap-4">
              <span class="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">
                {{ previewData.length }} Results
              </span>
              <USeparator orientation="vertical" class="h-4" />
              <div class="flex items-center gap-2">
                <UButton label="Headers" icon="i-heroicons-adjustments-horizontal" variant="ghost" color="neutral" size="sm" class="font-bold" @click="openEditor('headers')" />
                <template v-if="previewData.length > 0">
                  <UButton label="JSON" icon="i-heroicons-arrow-down-tray" variant="ghost" color="neutral" size="sm" class="font-bold" @click="downloadJson" />
                  <UButton label="Clear" icon="i-heroicons-trash" variant="ghost" color="error" size="sm" class="font-bold" @click="clearData" />
                </template>
              </div>
            </div>
            <UButton
              label="New Record"
              icon="i-heroicons-plus"
              variant="outline"
              color="neutral"
              size="sm"
              class="font-bold px-4"
              @click="openEditor('create')"
            />
          </div>
        </div>

        <!-- Table View -->
        <div class="flex-1 min-h-0 relative flex flex-col overflow-hidden">
          <div
            v-if="showLoadingIndicator"
            class="absolute inset-0 z-20 flex items-center justify-center bg-white/50 dark:bg-black/50 backdrop-blur-[1px]"
          >
            <UIcon name="i-heroicons-arrow-path" class="animate-spin w-10 h-10 text-primary" />
          </div>

          <div
            v-if="previewError"
            class="p-20 flex flex-col items-center justify-center text-center"
          >
            <UIcon name="i-heroicons-exclamation-triangle" class="text-error-500 w-16 h-16 mb-6 opacity-50" />
            <h3 class="text-xl font-bold mb-3 text-neutral-900 dark:text-neutral-100 uppercase tracking-widest">
              Request Failed
            </h3>
            <p class="text-sm text-neutral-500 font-mono mb-8 max-w-lg leading-relaxed">
              {{ previewError }}
            </p>
            <UButton label="Retry Request" color="neutral" variant="soft" size="lg" class="px-8 font-bold" @click="refreshEntityData" />
          </div>

          <div v-else class="flex-1 overflow-auto custom-scrollbar h-full">
            <UTable
              v-if="tableColumns.length > 1 && !previewLoading"
              :columns="tableColumns"
              :data="previewData || []"
              class="min-w-max h-full"
              :ui="{
                thead: 'bg-gray-50/80 dark:bg-zinc-900/80 sticky top-0 z-30 backdrop-blur-sm',
                th: 'text-[11px] font-bold uppercase tracking-widest text-neutral-500 border-b border-gray-200/50 dark:border-gray-800/50 py-4 px-6',
              }"
            >
              <template #actions-cell="{ row }">
                <div class="flex items-center justify-center gap-2 w-30 shrink-0 sticky left-0 z-10">
                  <UButton icon="i-heroicons-eye" variant="ghost" color="neutral" size="sm" @click="openEditor('view', getRowData(row))" />
                  <UButton icon="i-heroicons-pencil" variant="ghost" color="neutral" size="sm" @click="openEditor('update', getRowData(row))" />
                  <UButton icon="i-heroicons-trash" variant="ghost" color="error" size="sm" @click="deleteItem(getRowData(row).ID || getRowData(row).Id)" />
                </div>
              </template>

              <template v-for="col in tableColumns.filter(c => c.id !== 'actions')" :key="col.id" #[`${col.id}-cell`]="{ getValue, row }">
                <template v-if="getRowData(row)">
                  <div class="px-2 py-1">
                    <template v-if="Array.isArray(getValue())">
                      <UButton :label="`${getValue().length} Items`" variant="soft" color="primary" size="xs" class="font-bold" @click.stop="openEditor('view', getValue())" />
                    </template>
                    <template v-else-if="getValue() && typeof getValue() === 'object'">
                      <UButton label="Object" variant="soft" color="neutral" size="xs" class="font-bold" @click.stop="openEditor('view', getValue())" />
                    </template>
                    <template v-else-if="getValue() === null">
                      <span class="opacity-20 italic text-[11px]">{{ isNavigationProperty(col.id) ? 'not expanded' : '-' }}</span>
                    </template>
                    <template v-else>
                      <span class="font-mono text-[13px] text-neutral-700 dark:text-neutral-300">{{ getValue() }}</span>
                    </template>
                  </div>
                </template>
              </template>
            </UTable>

            <div
              v-if="previewData.length === 0 && !previewLoading"
              class="p-32 flex flex-col items-center justify-center opacity-40 italic text-neutral-500"
            >
              <UIcon name="i-heroicons-magnifying-glass" class="w-12 h-12 mb-4 opacity-20" />
              <p class="text-base tracking-wide uppercase tracking-[0.2em]">
                No records match your query
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <DataEditor
      v-model:editor="editor"
      @refresh="refreshEntityData"
    />
  </div>
</template>
