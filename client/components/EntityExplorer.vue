<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useSharedODataState } from '../composables/useODataState'
import type { EditorState } from '../composables/useODataState'

const { selectedService, selectedEntity, config } = useSharedODataState()

const previewLoading = ref(false)
const previewError = ref<string | null>(null)
const previewData = ref<Record<string, unknown>[]>([])
const queryParams = ref({ id: '', filter: '', select: '', top: 50 })

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
  queryParams.value.id = ''
  await refreshEntityData()
}

async function refreshEntityData() {
  if (!selectedService.value || !selectedEntity.value) return
  previewLoading.value = true
  previewError.value = null
  try {
    const route = selectedService.value.route || selectedService.value.name.toLowerCase()
    const url = new URL(`${window.location.origin}${config.value.basePath}/${route}/${selectedEntity.value}`)
    if (queryParams.value.id) {
      url.searchParams.set('id', queryParams.value.id)
    }
    else {
      if (queryParams.value.filter) url.searchParams.set('$filter', queryParams.value.filter)
      if (queryParams.value.select) url.searchParams.set('$select', queryParams.value.select)
      if (queryParams.value.top) url.searchParams.set('$top', queryParams.value.top.toString())
    }
    const res = await fetch(url.toString())
    const data = await res.json()
    previewData.value = (Array.isArray(data) ? data : (data.value || [data])) as Record<string, unknown>[]
  }
  catch (e: unknown) {
    previewError.value = (e as Error).message
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
  if (!selectedService.value || !selectedEntity.value) return
  const idKey = Object.keys(row).find(k => k.toLowerCase() === 'id')
  const id = idKey ? row[idKey] : null
  if (!id || !confirm(`Delete item ${id}?`)) return
  try {
    const route = selectedService.value.route || selectedService.value.name.toLowerCase()
    const res = await fetch(`${config.value.basePath}/${route}/${selectedEntity.value}?id=${id}`, { method: 'DELETE' })
    if (res.ok) await refreshEntityData()
  }
  catch (e: unknown) {
    alert((e as Error).message)
  }
}

const previewColumns = computed(() => {
  const firstRow = previewData.value[0]
  return firstRow ? Object.keys(firstRow).filter(k => k !== '__metadata') : []
})

watch(selectedEntity, (newEntity) => {
  if (newEntity) refreshEntityData()
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
      class="flex-1 flex flex-col min-h-0 bg-content rounded-t-xl overflow-hidden border-t border-x border-base shadow-sm"
    >
      <!-- Row 2: Filter Toolbar -->
      <div class="p-3 pr-4 flex items-end gap-4 bg-surface shrink-0 font-sans border-b border-base text-base">
        <div class="flex flex-col gap-1 w-24">
          <label class="text-[9px] uppercase font-bold text-zinc-600 dark:text-zinc-400 tracking-widest ml-1 opacity-70">Key</label>
          <input
            v-model="queryParams.id"
            type="text"
            placeholder="ID"
            :disabled="!!queryParams.filter"
            class="h-8 bg-base border border-base rounded px-2 text-[11px] font-mono outline-none focus:border-zinc-500 disabled:opacity-30 text-base w-full"
            @keyup.enter="refreshEntityData"
          >
        </div>
        <div class="flex flex-col gap-1 flex-1">
          <label class="text-[9px] uppercase font-bold text-zinc-600 dark:text-zinc-400 tracking-widest ml-1 opacity-70">OData Filter Query</label>
          <input
            v-model="queryParams.filter"
            type="text"
            placeholder="e.g. Name eq 'Test'"
            :disabled="!!queryParams.id"
            class="h-8 bg-base border border-base rounded px-2 text-[11px] font-mono outline-none focus:border-primary/50 disabled:opacity-30 text-base w-full"
            @keyup.enter="refreshEntityData"
          >
        </div>
        <div class="flex items-center">
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
      <div class="py-2 pl-4 pr-4 flex items-center justify-between bg-surface border-b border-base shrink-0">
        <div class="flex items-center gap-2 text-base">
          <span
            v-if="previewData.length > 0"
            class="text-[10px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-widest"
          >
            Items ({{ previewData.length }})
          </span>
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
      <div class="flex-1 overflow-auto custom-scrollbar bg-content">
        <div
          v-if="previewLoading"
          class="p-20 flex justify-center opacity-30"
        >
          <NLoading />
        </div>
        <template v-else>
          <table class="w-full text-left text-[11px] border-separate border-spacing-0 min-w-max">
            <thead class="sticky top-0 z-10">
              <tr class="text-zinc-800 dark:text-zinc-200 uppercase text-[9px] font-black tracking-[0.15em]">
                <!-- Explicit rounding for sticky header corners -->
                <th class="rounded-tl-xl px-4 py-3 w-28 text-center border-r border-b border-base bg-zinc-100/80 dark:bg-zinc-900/80 backdrop-blur-sm font-bold uppercase text-[9px]">
                  Actions
                </th>
                <th
                  v-for="(key, idx) in previewColumns"
                  :key="key"
                  class="px-4 py-3 border-b border-base bg-zinc-100/80 dark:bg-zinc-900/80 backdrop-blur-sm font-bold uppercase text-[9px]"
                  :class="{ 'rounded-tr-xl': idx === previewColumns.length - 1 }"
                >
                  {{ key }}
                </th>
              </tr>
            </thead>
            <tbody class="divide-y border-base dark:divide-zinc-800/50 font-mono text-base text-[11px]">
              <tr
                v-for="(row, idx) in previewData"
                :key="idx"
                class="hover:bg-primary/5 transition-colors"
              >
                <td class="p-0 border-r border-base align-middle text-base">
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
                  class="px-4 py-2.5 truncate max-w-[300px] opacity-90 text-[11px]"
                >
                  {{ row[key] }}
                </td>
              </tr>
            </tbody>
          </table>
        </template>
      </div>
    </div>
    <DataEditor
      v-model:editor="editor"
      @refresh="refreshEntityData"
    />
  </div>
</template>
