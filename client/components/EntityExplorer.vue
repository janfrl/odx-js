<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useSharedODataState } from '../composables/useODataState'

const { selectedService, selectedEntity, config } = useSharedODataState()

const previewLoading = ref(false)
const previewError = ref<string | null>(null)
const previewData = ref<any[]>([])
const queryParams = ref({ id: '', filter: '', select: '', top: 50 })

const editor = ref({
  show: false,
  mode: 'view' as 'view' | 'create' | 'update',
  json: '',
  loading: false,
  error: null as string | null,
  original: null as any | null,
})

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
    } else {
      if (queryParams.value.filter) url.searchParams.set('$filter', queryParams.value.filter)
      if (queryParams.value.select) url.searchParams.set('$select', queryParams.value.select)
      if (queryParams.value.top) url.searchParams.set('$top', queryParams.value.top.toString())
    }
    const res = await fetch(url.toString())
    const data = await res.json()
    previewData.value = Array.isArray(data) ? data : (data.value || [data])
  } catch (e: any) {
    previewError.value = e.message
  } finally {
    previewLoading.value = false
  }
}

function openEditor(mode: 'view' | 'create' | 'update', row: any = null) {
  editor.value = {
    show: true,
    mode,
    error: null,
    loading: false,
    original: row,
    json: row ? JSON.stringify(row, null, 2) : JSON.stringify({ ID: '', Name: '' }, null, 2),
  }
}

async function deleteItem(row: any) {
  if (!selectedService.value || !selectedEntity.value) return
  const idKey = Object.keys(row).find(k => k.toLowerCase() === 'id')
  const id = idKey ? row[idKey] : null
  if (!id || !confirm(`Delete item ${id}?`)) return
  try {
    const route = selectedService.value.route || selectedService.value.name.toLowerCase()
    const res = await fetch(`${config.value.basePath}/${route}/${selectedEntity.value}?id=${id}`, { method: 'DELETE' })
    if (res.ok) await refreshEntityData()
  } catch (e: any) {
    alert(e.message)
  }
}

const previewColumns = computed(() => (previewData.value && previewData.value.length) ? Object.keys(previewData.value[0]).filter(k => k !== '__metadata') : [])

watch(selectedEntity, (newEntity) => {
  if (newEntity) refreshEntityData()
}, { immediate: true })
</script>

<template>
  <div class="flex-1 flex flex-col overflow-hidden px-6">
    <!-- Entity Tabs -->
    <div class="flex gap-4 overflow-x-auto no-scrollbar border-b border-base mb-4 shrink-0">
      <button
        v-for="entity in (selectedService?.entities || [])"
        :key="entity"
        class="text-[11px] font-bold font-mono px-1 py-2 border-b-2 transition-all bg-transparent cursor-pointer relative"
        :class="selectedEntity === entity ? 'text-primary border-primary' : 'text-zinc-500 border-transparent hover:text-zinc-700 dark:hover:text-zinc-300'"
        @click="selectEntity(entity)"
      >
        {{ entity }}
      </button>
    </div>

    <!-- Toolbar / Filter Bar -->
    <div v-if="selectedEntity" class="flex-1 flex flex-col min-h-0 bg-zinc-50 dark:bg-zinc-900/50 rounded-t-lg overflow-hidden border-t border-x border-base shadow-sm">
      <div class="p-3 flex items-end gap-3 border-b border-base bg-white dark:bg-zinc-900 shrink-0 font-sans text-base">
        <div class="flex flex-col gap-1 w-24">
          <label class="text-[9px] uppercase font-bold text-zinc-400 tracking-[0.1em] ml-1">Key</label>
          <input
            v-model="queryParams.id"
            type="text"
            placeholder="ID..."
            :disabled="!!queryParams.filter"
            class="h-8 bg-zinc-50 dark:bg-zinc-800 border border-base rounded px-2 text-xs font-mono outline-none focus:border-primary/50 disabled:opacity-30 text-base-content w-full"
            @keyup.enter="refreshEntityData"
          >
        </div>
        <div class="flex flex-col gap-1 flex-1">
          <label class="text-[9px] uppercase font-bold text-zinc-400 tracking-[0.1em] ml-1">OData Filter Query</label>
          <input
            v-model="queryParams.filter"
            type="text"
            placeholder="e.g. Name eq 'Test'..."
            :disabled="!!queryParams.id"
            class="h-8 bg-zinc-50 dark:bg-zinc-800 border border-base rounded px-2 text-xs font-mono outline-none focus:border-primary/50 disabled:opacity-30 text-base-content w-full"
            @keyup.enter="refreshEntityData"
          >
        </div>
        <div class="flex items-center gap-2">
          <NButton
            n="primary"
            variant="solid"
            class="px-4 font-bold uppercase text-[10px] h-[32px]"
            @click="refreshEntityData"
          >
            Run
          </NButton>
          <NButton
            n="green"
            class="px-4 font-bold uppercase text-[10px] h-[32px]"
            @click="openEditor('create')"
          >
            Add Item
          </NButton>
        </div>
      </div>

      <!-- Table Area (Reaches Bottom) -->
      <div class="flex-1 overflow-auto custom-scrollbar bg-white dark:bg-[#0c0c0d]">
        <div v-if="previewLoading" class="p-20 flex justify-center opacity-30">
          <NLoading />
        </div>
        <template v-else>
          <table class="w-full text-left text-[11px] border-collapse min-w-max">
            <thead class="sticky top-0 z-10 bg-zinc-50 dark:bg-zinc-900 border-b border-base">
              <tr class="text-zinc-500 uppercase text-[9px] font-bold tracking-widest">
                <th class="px-4 py-3 w-28 text-center border-r border-base">Actions</th>
                <th v-for="key in previewColumns" :key="key" class="px-4 py-3">{{ key }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-base font-mono">
              <tr v-for="(row, idx) in previewData" :key="idx" class="hover:bg-primary/5 transition-colors">
                <td class="p-0 border-r border-base align-middle">
                  <div class="flex items-center justify-center gap-2">
                    <button class="p-1.5 text-zinc-400 hover:text-primary transition-colors bg-transparent border-none cursor-pointer" title="View" @click="openEditor('view', row)">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    </button>
                    <button class="p-1.5 text-zinc-400 hover:text-primary transition-colors bg-transparent border-none cursor-pointer" title="Edit" @click="openEditor('update', row)">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button class="p-1.5 text-zinc-400 hover:text-red-500 transition-colors bg-transparent border-none cursor-pointer" title="Delete" @click="deleteItem(row)">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </td>
                <td v-for="key in previewColumns" :key="key" class="px-4 py-2.5 truncate max-w-[300px] text-zinc-600 dark:text-zinc-300">
                  {{ row[key] }}
                </td>
              </tr>
            </tbody>
          </table>
        </template>
      </div>
    </div>
    <DataEditor v-if="editor.show" v-model:editor="editor" @refresh="refreshEntityData" />
  </div>
</template>
