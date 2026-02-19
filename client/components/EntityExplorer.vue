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

// Re-fetch data when entity changes
watch(selectedEntity, (newEntity) => {
  if (newEntity) refreshEntityData()
}, { immediate: true })
</script>

<template>
  <div class="flex-1 flex flex-col min-h-0 overflow-hidden">
    <div class="flex gap-1 overflow-x-auto no-scrollbar border-b border-zinc-100 dark:border-zinc-800 pb-px mb-6">
      <button 
        v-for="entity in (selectedService?.entities || [])" 
        :key="entity" 
        :class="selectedEntity === entity ? 'text-[#00dc82] border-[#00dc82]' : 'text-zinc-400 border-transparent hover:text-zinc-600 dark:hover:text-zinc-200'"
        class="px-4 py-2 text-[11px] font-mono border-b-2 transition-all whitespace-nowrap font-bold bg-transparent cursor-pointer"
        @click="selectEntity(entity)"
      >
        {{ entity }}
      </button>
    </div>

    <div v-if="selectedEntity" class="flex-1 flex flex-col min-h-0 bg-zinc-50 dark:bg-[#0a0a0a] rounded-t-2xl overflow-hidden shadow-xl shadow-black/5">
      <div class="px-6 py-3 flex flex-wrap gap-4 items-end shrink-0 border-b border-zinc-100 dark:border-zinc-800/50 bg-white/50 dark:bg-[#0c0c0d]">
        <div class="flex flex-col gap-1 w-20">
          <label class="text-[9px] uppercase font-bold text-zinc-400 dark:text-zinc-600 tracking-widest px-0.5">Key</label>
          <input v-model="queryParams.id" type="text" placeholder="Key" :class="queryParams.filter.length > 0 ? 'opacity-20 pointer-events-none' : ''" class="h-7 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-2 font-mono text-[11px] focus:border-[#00dc82]/50 outline-none w-full text-zinc-900 dark:text-zinc-100" @keyup.enter="refreshEntityData">
        </div>
        <div class="flex flex-col gap-1 flex-1 min-w-[200px]">
          <label class="text-[9px] uppercase font-bold text-zinc-400 dark:text-zinc-600 tracking-widest px-0.5">Filter</label>
          <input v-model="queryParams.filter" type="text" placeholder="Name eq 'Test'" :class="queryParams.id.length > 0 ? 'opacity-20 pointer-events-none' : ''" class="h-7 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-2 font-mono text-[11px] focus:border-[#00dc82]/50 outline-none w-full text-zinc-900 dark:text-zinc-100" @keyup.enter="refreshEntityData">
        </div>
        <div class="flex items-center gap-2">
          <button class="h-7 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 text-[10px] font-bold uppercase px-4 rounded border border-zinc-200 dark:border-zinc-700 cursor-pointer" @click="refreshEntityData">Run</button>
          <button class="h-7 bg-[#00dc82] hover:bg-[#00dc82]/90 text-[#0c0c0d] text-[10px] font-bold uppercase px-4 rounded shadow-sm flex items-center gap-2 cursor-pointer" @click="openEditor('create')">
            <span>Add</span>
          </button>
        </div>
      </div>
      
      <div class="flex-1 overflow-auto custom-scrollbar bg-white dark:bg-[#0c0c0d]">
        <div v-if="previewLoading" class="flex items-center justify-center p-20 opacity-30">
          <svg class="animate-spin h-8 w-8 text-[#00dc82]" viewBox="0 0 24 24"><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
        </div>
        <div v-else>
          <table class="w-full text-left text-[11px] border-collapse min-w-max">
            <thead>
              <tr class="text-zinc-400 uppercase text-[9px] font-bold tracking-widest border-b border-zinc-100 dark:border-zinc-800 sticky top-0 bg-white dark:bg-zinc-900 z-10 shadow-sm">
                <th class="py-4 w-28 text-center border-r border-zinc-100 dark:border-zinc-800">Actions</th>
                <th v-for="key in previewColumns" :key="key" class="px-4 py-4">{{ key }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-zinc-100 dark:divide-zinc-800 font-mono text-zinc-500 dark:text-zinc-400/80">
              <tr v-for="(row, idx) in previewData" :key="idx" class="hover:bg-[#00dc82]/5 transition-colors h-12">
                <td class="p-0 border-r border-zinc-100 dark:border-zinc-800 align-middle">
                  <div class="flex items-center justify-center gap-3 h-full">
                    <button class="opacity-30 hover:opacity-100 hover:text-[#00dc82] p-1 bg-transparent border-0 cursor-pointer" title="View" @click="openEditor('view', row)">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    </button>
                    <button class="opacity-30 hover:opacity-100 hover:text-[#00dc82] p-1 bg-transparent border-0 cursor-pointer" title="Edit" @click="openEditor('update', row)">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button class="opacity-30 hover:opacity-100 hover:text-red-500 p-1 bg-transparent border-0 cursor-pointer" title="Delete" @click="deleteItem(row)">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </td>
                <td v-for="key in previewColumns" :key="key" class="px-4 py-3 truncate max-w-[350px] align-middle text-zinc-900 dark:text-zinc-100">
                  {{ row[key] }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    
    <DataEditor v-if="editor.show" v-model:editor="editor" @refresh="refreshEntityData" />
  </div>
</template>
