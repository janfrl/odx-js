<script setup lang="ts">
import type { EditorState } from '../composables/useODataState'
import { computed, onMounted, ref, watch } from 'vue'
import { useSharedODataState } from '../composables/useODataState'

const { selectedService, selectedEntity, config, clearEntityMockData } = useSharedODataState()

const previewLoading = ref(false)
const showLoadingIndicator = ref(false)
const previewError = ref<string | null>(null)
const previewData = ref<Record<string, unknown>[]>([])
const queryInput = ref('?')
const schema = ref<any>(null)

let loadingTimeout: ReturnType<typeof setTimeout> | null = null

// Delay loading indicator to avoid flickering on fast requests
watch(previewLoading, (isLoading) => {
  if (loadingTimeout)
    clearTimeout(loadingTimeout)

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

const ICONS = {
  view: 'M16 8c-6.6 0-12 8-12 8s5.4 8 12 8 12-8 12-8-5.4-8-12-8zm0 13c-2.8 0-5-2.2-5-5s2.2-5 5-5 5 2.2 5 5-2.2 5-5 5zm0-8c-1.7 0-3 1.3-3 3s1.3 3 3 3 3-1.3 3-3-1.3-3-3-3z',
  edit: 'M26 4.5l-2.5-2.5c-0.7-0.7-1.8-0.7-2.5 0L4 19.1V24h4.9l17.1-17c0.7-0.7 0.7-1.8 0-2.5zM7.9 22H6v-1.9l13.1-13.1 1.9 1.9L7.9 22zM22.4 9.4l-1.9-1.9 1.6-1.6 1.9 1.9-1.6 1.6z',
  trash: 'M12 12h2v12h-2z M18 12h2v12h-2z M4 6v2h2v20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8h2V6zm4 22V8h16v20z M10 2h12v2H10z',
}

async function selectEntity(entity: string) {
  selectedEntity.value = entity
  queryInput.value = '?'
}

async function fetchSchema() {
  if (!selectedService.value)
    return
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
  if (!selectedService.value || !selectedEntity.value)
    return
  previewLoading.value = true
  previewError.value = null
  // We no longer clear previewData here to keep the old table visible until new data arrives
  try {
    const route = selectedService.value.route || selectedService.value.name.toLowerCase()

    // Construct URL with raw query input
    let urlPath = `${config.value.basePath}/${route}/${selectedEntity.value}`
    if (queryInput.value && queryInput.value !== '?') {
      const q = queryInput.value.startsWith('?') ? queryInput.value : `?${queryInput.value}`
      urlPath += q
    }

    const res = await fetch(urlPath)
    if (!res.ok) {
      const errorText = await res.text().catch(() => '')
      let statusMessage = res.statusText || `Server Error ${res.status}`
      try {
        const errData = JSON.parse(errorText)
        statusMessage = errData.message || errData.statusMessage || (errData.data && errData.data.statusMessage) || statusMessage
      }
      catch {
        if (errorText && errorText.length < 100)
          statusMessage = errorText
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

function openEditor(mode: 'view' | 'create' | 'update', row: Record<string, unknown> | null = null) {
  let initialJson = ''
  if (row) {
    initialJson = JSON.stringify(row, null, 2)
  }
  else if (mode === 'create' && currentEntitySchema.value) {
    // Generate template from schema
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

async function deleteItem(row: Record<string, unknown>) {
  if (!selectedService.value || !selectedEntity.value)
    return
  const idKey = Object.keys(row).find(k => k.toLowerCase() === 'id')
  const id = idKey ? row[idKey] : null

  if (!id || !confirm(`Delete item ${id}?`))
    return
  try {
    const route = selectedService.value.route || selectedService.value.name.toLowerCase()
    const res = await fetch(`${config.value.basePath}/${route}/${selectedEntity.value}?id=${id}`, { method: 'DELETE' })
    if (res.ok) {
      devtoolsUiShowNotification({
        message: `Item ${id} deleted successfully`,
        icon: 'i-carbon-checkmark-outline',
        position: 'bottom-right',
        classes: 'text-base border-base',
      })
      await refreshEntityData()
    }
  }
  catch (e: unknown) {
    devtoolsUiShowNotification({
      message: (e as Error).message,
      icon: 'i-carbon-error',
      position: 'bottom-right',
      classes: 'text-base border-base',
    })
  }
}

async function clearData() {
  if (!selectedService.value || !selectedEntity.value)
    return

  if (!confirm(`Are you sure you want to clear all mock data for ${selectedEntity.value}? This cannot be undone.`))
    return

  try {
    await clearEntityMockData(selectedService.value.name, selectedEntity.value)
    devtoolsUiShowNotification({
      message: `All mock data for ${selectedEntity.value} cleared`,
      icon: 'i-carbon-trash-can',
      position: 'bottom-right',
      classes: 'text-base border-base',
    })
    await refreshEntityData()
  }
  catch (e: unknown) {
    devtoolsUiShowNotification({
      message: (e as Error).message,
      icon: 'i-carbon-error',
      position: 'bottom-right',
      classes: 'text-base border-base',
    })
  }
}

function downloadJson() {
  if (previewData.value.length === 0)
    return
  const blob = new Blob([JSON.stringify(previewData.value, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${selectedEntity.value}.json`
  a.click()
  URL.revokeObjectURL(url)
}

const currentEntitySchema = computed(() => {
  const entityName = selectedEntity.value
  if (!schema.value || !entityName)
    return null

  // Find the entity by set name or type name with robust plural handling (e.g. Categories -> Category)
  return schema.value.entities?.find((e: any) =>
    e.entitySet === entityName
    || e.name === entityName
    || entityName.toLowerCase().startsWith(e.name.toLowerCase())
    || e.name.toLowerCase().startsWith(entityName.toLowerCase())
    || (e.name.endsWith('y') && entityName.toLowerCase().startsWith(e.name.toLowerCase().slice(0, -1))),
  ) || null
})

function isNavigationProperty(key: string) {
  return currentEntitySchema.value?.navigationProperties?.some((np: any) =>
    np.name.toLowerCase() === key.toLowerCase()
  )
}

const previewColumns = computed(() => {
  const edmxEntity = currentEntitySchema.value
  if (!edmxEntity) return []

  const edmxProps = edmxEntity.properties?.map((p: any) => p.name) || []
  const edmxNavProps = edmxEntity.navigationProperties?.map((np: any) => np.name) || []

  // Final column list: properties followed by navigation properties
  const combined = [...edmxProps, ...edmxNavProps]

  // Filter out redundant technical properties based on ReferentialConstraints
  // (e.g. Hide 'SupplierID' if it's the dependent property for the 'Supplier' navigation)
  return combined.filter((col) => {
    const isTechnicalFK = schema.value?.associations?.some((assoc: any) => {
      return assoc.constraint?.dependentProperty === col
    })
    return !isTechnicalFK
  })
})

watch(selectedService, (newSvc) => {
  if (newSvc && newSvc.entities && newSvc.entities.length > 0) {
    selectedEntity.value = newSvc.entities[0] ?? null
    fetchSchema()
  }
  else {
    selectedEntity.value = null
    schema.value = null
  }
}, { immediate: true })

watch(selectedEntity, (newEntity) => {
  if (newEntity)
    refreshEntityData()
}, { immediate: true })

onMounted(() => {
  if (selectedService.value) {
    fetchSchema()
  }
})
</script>

<template>
  <div class="flex-1 flex flex-col overflow-hidden px-6 text-base">
    <!-- Row 1: Tabs -->
    <div class="flex items-center border-b border-base mb-4 shrink-0 pr-1 text-base">
      <div class="flex gap-4 overflow-x-auto custom-scrollbar pb-px pr-4">
        <button
          v-for="entity in (selectedService?.entities || [])"
          :key="entity"
          class="text-[11px] font-bold font-mono px-1 py-2 border-b-2 transition-all bg-transparent cursor-pointer relative whitespace-nowrap"
          :class="selectedEntity === entity ? 'text-primary border-primary' : 'text-muted border-transparent hover:text-base'"
          @click="selectEntity(entity)"
        >
          {{ entity }}
        </button>
      </div>
    </div>

    <!-- Main Container -->
    <div
      v-if="selectedEntity"
      class="flex-1 flex flex-col min-h-0 bg-content rounded-t-xl overflow-hidden border-t border-x border-base shadow-sm text-base"
    >
      <!-- Row 2: Raw Request Toolbar -->
      <div class="p-3 pr-4 flex items-end gap-4 bg-surface shrink-0 font-sans border-b border-base text-base">
        <div class="flex flex-col gap-1 flex-1 text-base">
          <label class="text-[9px] uppercase font-bold text-zinc-600 dark:text-zinc-400 tracking-widest ml-1 opacity-70 mb-1 text-base">
            OData Request Query
          </label>
          <div class="relative flex items-center text-base">
            <input
              v-model="queryInput"
              type="text"
              placeholder="?id=... or ?$filter=..."
              class="h-8 bg-base border border-base rounded px-3 text-[11px] font-mono outline-none focus:border-primary/50 text-base w-full transition-all"
              @keyup.enter="refreshEntityData"
            >
          </div>
        </div>
        <div class="flex items-center text-base">
          <NButton
            class="px-4 h-[32px] transition-all text-zinc-700 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-white bg-zinc-500/10 ring-1 ring-inset ring-zinc-500/25 hover:bg-zinc-500/20 active:bg-zinc-500/25 border-none shadow-none font-bold uppercase text-[10px]"
            icon="i-carbon-play"
            @click="refreshEntityData"
          >
            Run
          </NButton>
        </div>
      </div>

      <!-- Row 3: Action Toolbar -->
      <div class="py-2 pl-4 pr-4 flex items-center justify-between bg-surface border-b border-base shrink-0 text-base">
        <div class="flex items-center gap-2 text-base">
          <span
            v-if="previewData.length > 0"
            class="text-[10px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-widest text-base"
          >
            Items ({{ previewData.length }})
          </span>
          <div
            v-if="previewData.length > 0"
            class="flex items-center gap-1 ml-2 text-base"
          >
            <NButton
              class="px-2 h-6 !bg-transparent !border-none !shadow-none text-muted hover:text-primary transition-colors text-[10px] uppercase font-bold"
              icon="i-carbon-download"
              @click="downloadJson"
            >
              JSON
            </NButton>
            <NButton
              class="px-2 h-6 !bg-transparent !border-none !shadow-none text-muted hover:text-red-500 transition-colors text-[10px] uppercase font-bold"
              icon="i-carbon-trash-can"
              @click="clearData"
            >
              Clear
            </NButton>
          </div>
        </div>
        <NButton
          class="px-3 h-7 transition-all text-zinc-700 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-white bg-zinc-500/10 ring-1 ring-inset ring-zinc-500/25 hover:bg-zinc-500/20 active:bg-zinc-500/25 border-none shadow-none font-bold uppercase text-[10px]"
          icon="i-carbon-add"
          @click="openEditor('create')"
        >
          Create Item
        </NButton>
      </div>

      <!-- Table Area -->
      <div class="flex-1 overflow-auto custom-scrollbar bg-content text-base relative">
        <!-- Persistent loading overlay for long requests -->
        <div
          v-if="showLoadingIndicator"
          class="absolute inset-0 z-20 flex items-center justify-center bg-white/50 dark:bg-[#0c0c0d]/50 backdrop-blur-[1px]"
        >
          <NLoading class="opacity-50" />
        </div>

        <div
          v-if="previewError"
          class="p-16 flex flex-col items-center justify-center text-center text-base"
        >
          <div class="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mb-6 text-base">
            <div class="i-carbon-warning-filled text-red-500 w-7 h-7 text-base" />
          </div>
          <h3 class="text-xs font-bold text-red-500/80 uppercase tracking-widest mb-3 text-base">
            OData Request Failed
          </h3>
          <p class="text-[12px] text-zinc-500 dark:text-zinc-400 font-mono mb-6 max-w-lg leading-relaxed text-base">
            {{ previewError }}
          </p>
          <button
            class="text-[10px] font-bold uppercase tracking-wider hover:underline underline-offset-4 decoration-zinc-500/30 hover:decoration-primary text-muted hover:text-primary transition-all bg-transparent border-none cursor-pointer text-base"
            @click="refreshEntityData"
          >
            Retry Request
          </button>
        </div>

        <template v-else>
          <table
            v-if="previewData.length > 0"
            class="w-full text-left text-[11px] border-separate border-spacing-0 min-w-max text-base"
            :class="{ 'opacity-50 pointer-events-none transition-opacity duration-300': previewLoading && !showLoadingIndicator }"
          >
            <thead class="sticky top-0 z-10 text-base">
              <tr class="text-zinc-800 dark:text-zinc-200 text-[9px] font-black tracking-wide text-base">
                <th class="px-4 py-3 w-28 text-center border-r border-b border-base bg-zinc-100/80 dark:bg-zinc-900/80 backdrop-blur-sm font-bold uppercase text-[9px]">
                  Actions
                </th>
                <th
                  v-for="key in previewColumns"
                  :key="key"
                  class="px-4 py-3 border-b border-base bg-zinc-100/80 dark:bg-zinc-900/80 backdrop-blur-sm font-bold normal-case text-[10px] opacity-80"
                >
                  {{ key }}
                </th>
              </tr>
            </thead>
            <tbody class="divide-y border-base dark:divide-zinc-800/50 font-mono text-[11px]">
              <tr
                v-for="(row, idx) in previewData"
                :key="idx"
                class="hover:bg-primary/5 transition-colors"
              >
                <td class="p-0 border-r border-base align-middle">
                  <div class="flex items-center justify-center gap-2">
                    <button
                      class="p-1.5 text-muted hover:text-primary transition-colors bg-transparent border-none cursor-pointer"
                      title="View"
                      @click="openEditor('view', row)"
                    >
                      <svg
                        class="w-4 h-4"
                        viewBox="0 0 32 32"
                        fill="currentColor"
                      ><path :d="ICONS.view" /></svg>
                    </button>
                    <button
                      class="p-1.5 text-muted hover:text-primary transition-colors bg-transparent border-none cursor-pointer"
                      title="Edit"
                      @click="openEditor('update', row)"
                    >
                      <svg
                        class="w-4 h-4"
                        viewBox="0 0 32 32"
                        fill="currentColor"
                      ><path :d="ICONS.edit" /></svg>
                    </button>
                    <button
                      class="p-1.5 text-muted hover:text-red-500 transition-colors bg-transparent border-none cursor-pointer"
                      title="Delete"
                      @click="deleteItem(row)"
                    >
                      <svg
                        class="w-4 h-4"
                        viewBox="0 0 32 32"
                        fill="currentColor"
                      ><path :d="ICONS.trash" /></svg>
                    </button>
                  </div>
                </td>
                <td
                  v-for="key in previewColumns"
                  :key="key"
                  class="px-4 py-2.5 truncate max-w-[300px] opacity-90"
                >
                  <template v-if="Array.isArray(row[key])">
                    <button
                      class="text-[10px] bg-primary/10 text-primary border border-primary/20 rounded px-1.5 py-0.5 font-bold hover:bg-primary/20 transition-colors cursor-pointer"
                      @click.stop="openEditor('view', row[key] as any)"
                    >
                      {{ (row[key] as any[]).length }} Items
                    </button>
                  </template>
                  <template v-else-if="row[key] && typeof row[key] === 'object'">
                    <button
                      class="text-[10px] bg-zinc-500/10 text-zinc-500 border border-zinc-500/20 rounded px-1.5 py-0.5 font-bold hover:bg-zinc-500/20 transition-colors cursor-pointer"
                      @click.stop="openEditor('view', row[key] as any)"
                    >
                      Object
                    </button>
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
            v-else-if="!previewLoading"
            class="p-20 flex flex-col items-center justify-center text-center opacity-40 italic space-y-2"
          >
            <div class="i-carbon-search w-8 h-8" />
            <p class="text-xs">
              No items found for this query
            </p>
          </div>
          <!-- Initial load spinner -->
          <div v-else-if="showLoadingIndicator" class="p-20 flex justify-center opacity-30">
            <NLoading />
          </div>
        </template>
      </div>
    </div>

    <!-- Placeholder when no entity is selected -->
    <div
      v-else
      class="flex-1 flex flex-col items-center justify-center text-center p-12 bg-zinc-500/5 rounded-t-xl border-t border-x border-base border-dashed"
    >
      <div class="w-16 h-16 rounded-2xl bg-base border border-base flex items-center justify-center mb-6 shadow-sm">
        <div class="i-carbon-ibm-cloud-direct-link-2-dedicated text-zinc-400 w-8 h-8" />
      </div>
      <h3 class="text-sm font-bold uppercase tracking-widest mb-2">
        Select an Entity
      </h3>
      <p class="text-[12px] text-muted max-w-[280px] leading-relaxed text-base">
        Choose one of the available entity sets above to explore, edit, or create OData records.
      </p>
    </div>

    <DataEditor
      v-model:editor="editor"
      @refresh="refreshEntityData"
    />
  </div>
</template>
