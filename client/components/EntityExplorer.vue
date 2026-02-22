<script setup lang="ts">
import type { EditorState } from '../composables/useODataState'
import { computed, ref, watch } from 'vue'
import { useSharedODataState } from '../composables/useODataState'

const { selectedService, selectedEntity, config, clearEntityMockData } = useSharedODataState()

const previewLoading = ref(false)
const previewError = ref<string | null>(null)
const previewData = ref<Record<string, unknown>[]>([])
const queryInput = ref('?')

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

async function refreshEntityData() {
  if (!selectedService.value || !selectedEntity.value)
    return
  previewLoading.value = true
  previewError.value = null
  previewData.value = []
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
  editor.value = {
    show: true,
    mode,
    error: null,
    loading: false,
    original: row,
    json: row ? JSON.stringify(row, null, 2) : JSON.stringify({ ID: '', Name: '' }, null, 2),
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

const previewColumns = computed(() => {
  const firstRow = previewData.value[0]
  return firstRow ? Object.keys(firstRow).filter(k => k !== '__metadata') : []
})

watch(selectedService, (newSvc) => {
  if (newSvc && newSvc.entities && newSvc.entities.length > 0) {
    selectedEntity.value = newSvc.entities[0]
  }
  else {
    selectedEntity.value = null
  }
})

watch(selectedEntity, (newEntity) => {
  if (newEntity)
    refreshEntityData()
}, { immediate: true })
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
              class="h-8 bg-base border border-base rounded px-3 text-[11px] font-mono outline-none focus:border-primary/50 text-base w-full transition-all text-base"
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
        <div class="flex items-center gap-2 text-base text-base">
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
      <div class="flex-1 overflow-auto custom-scrollbar bg-content text-base">
        <div
          v-if="previewLoading"
          class="p-20 flex justify-center opacity-30 text-base"
        >
          <NLoading />
        </div>

        <div
          v-else-if="previewError"
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
          >
            <thead class="sticky top-0 z-10 text-base">
              <tr class="text-zinc-800 dark:text-zinc-200 uppercase text-[9px] font-black tracking-[0.15em] text-base">
                <!-- No rounding since it docks to the toolbar above -->
                <th class="px-4 py-3 w-28 text-center border-r border-b border-base bg-zinc-100/80 dark:bg-zinc-900/80 backdrop-blur-sm font-bold uppercase text-[9px] text-base">
                  Actions
                </th>
                <th
                  v-for="key in previewColumns"
                  :key="key"
                  class="px-4 py-3 border-b border-base bg-zinc-100/80 dark:bg-zinc-900/80 backdrop-blur-sm font-bold uppercase text-[9px] text-base"
                >
                  {{ key }}
                </th>
              </tr>
            </thead>
            <tbody class="divide-y border-base dark:divide-zinc-800/50 font-mono text-base text-[11px] text-base">
              <tr
                v-for="(row, idx) in previewData"
                :key="idx"
                class="hover:bg-primary/5 transition-colors text-base"
              >
                <td class="p-0 border-r border-base align-middle text-base text-base">
                  <div class="flex items-center justify-center gap-2 text-base">
                    <button
                      class="p-1.5 text-muted hover:text-primary transition-colors bg-transparent border-none cursor-pointer text-base"
                      title="View"
                      @click="openEditor('view', row)"
                    >
                      <svg
                        class="w-4 h-4 text-base"
                        viewBox="0 0 32 32"
                        fill="currentColor"
                      ><path :d="ICONS.view" /></svg>
                    </button>
                    <button
                      class="p-1.5 text-muted hover:text-primary transition-colors bg-transparent border-none cursor-pointer text-base"
                      title="Edit"
                      @click="openEditor('update', row)"
                    >
                      <svg
                        class="w-4 h-4 text-base"
                        viewBox="0 0 32 32"
                        fill="currentColor"
                      ><path :d="ICONS.edit" /></svg>
                    </button>
                    <button
                      class="p-1.5 text-muted hover:text-red-500 transition-colors bg-transparent border-none cursor-pointer text-base"
                      title="Delete"
                      @click="deleteItem(row)"
                    >
                      <svg
                        class="w-4 h-4 text-base"
                        viewBox="0 0 32 32"
                        fill="currentColor"
                      ><path :d="ICONS.trash" /></svg>
                    </button>
                  </div>
                </td>
                <td
                  v-for="key in previewColumns"
                  :key="key"
                  class="px-4 py-2.5 truncate max-w-[300px] opacity-90 text-[11px] text-base"
                >
                  {{ row[key] }}
                </td>
              </tr>
            </tbody>
          </table>
          <div
            v-else
            class="p-20 flex flex-col items-center justify-center text-center opacity-40 italic space-y-2 text-base"
          >
            <div class="i-carbon-search w-8 h-8 text-base" />
            <p class="text-xs text-base">
              No items found for this query
            </p>
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
      <h3 class="text-sm font-bold text-base uppercase tracking-widest mb-2">
        Select an Entity
      </h3>
      <p class="text-[12px] text-muted max-w-[280px] leading-relaxed">
        Choose one of the available entity sets above to explore, edit, or create OData records.
      </p>
    </div>

    <DataEditor
      v-model:editor="editor"
      @refresh="refreshEntityData"
    />
  </div>
</template>
