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

const ICONS = {
  view: 'M16 8c-6.6 0-12 8-12 8s5.4 8 12 8 12-8 12-8-5.4-8-12-8zm0 13c-2.8 0-5-2.2-5-5s2.2-5 5-5 5 2.2 5 5-2.2 5-5 5zm0-8c-1.7 0-3 1.3-3 3s1.3 3 3 3 3-1.3 3-3-1.3-3-3-3z',
  edit: 'M26 4.5l-2.5-2.5c-0.7-0.7-1.8-0.7-2.5 0L4 19.1V24h4.9l17.1-17c0.7-0.7 0.7-1.8 0-2.5zM7.9 22H6v-1.9l13.1-13.1 1.9 1.9L7.9 22zM22.4 9.4l-1.9-1.9 1.6-1.6 1.9 1.9-1.6 1.6z',
  trash: 'M12 12h2v12h-2z M18 12h2v12h-2z M4 6v2h2v20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8h2V6zm4 22V8h16v20z M10 2h12v2H10z'
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
    <div class="flex gap-4 overflow-x-auto no-scrollbar border-b border-base mb-4 shrink-0">
      <button
        v-for="entity in (selectedService?.entities || [])"
        :key="entity"
        class="text-[11px] font-bold font-mono px-1 py-2 border-b-2 transition-all bg-transparent cursor-pointer relative"
        :class="selectedEntity === entity ? 'text-primary border-primary' : 'text-muted border-transparent hover:text-base'"
        @click="selectEntity(entity)"
      >
        {{ entity }}
      </button>
    </div>

    <div v-if="selectedEntity" class="flex-1 flex flex-col min-h-0 bg-content rounded-t-lg overflow-hidden border-t border-x border-base shadow-sm">
      <div class="p-3 flex items-end gap-3 border-b border-base bg-surface shrink-0 font-sans">
        <div class="flex flex-col gap-1 w-24">
          <label class="text-[9px] uppercase font-bold text-muted tracking-[0.1em] ml-1">Key</label>
          <input
            v-model="queryParams.id"
            type="text"
            placeholder="ID..."
            :disabled="!!queryParams.filter"
            class="h-8 bg-base border border-base rounded px-2 text-xs font-mono outline-none focus:border-primary/50 disabled:opacity-30 text-base w-full"
            @keyup.enter="refreshEntityData"
          >
        </div>
        <div class="flex flex-col gap-1 flex-1">
          <label class="text-[9px] uppercase font-bold text-muted tracking-[0.1em] ml-1">OData Filter Query</label>
          <input
            v-model="queryParams.filter"
            type="text"
            placeholder="e.g. Name eq 'Test'..."
            :disabled="!!queryParams.id"
            class="h-8 bg-base border border-base rounded px-2 text-xs font-mono outline-none focus:border-primary/50 disabled:opacity-30 text-base w-full"
            @keyup.enter="refreshEntityData"
          >
        </div>
        <div class="flex items-center gap-2">
          <NButton
            n="primary"
            variant="outline"
            icon="i-carbon-play"
            class="px-4 font-bold uppercase text-[10px] h-[32px]"
            @click="refreshEntityData"
          >
            Run
          </NButton>
          <NButton
            n="green"
            variant="solid"
            icon="i-carbon-add"
            class="px-4 font-bold uppercase text-[10px] h-[32px]"
            @click="openEditor('create')"
          >
            Add Item
          </NButton>
        </div>
      </div>

      <div class="flex-1 overflow-auto custom-scrollbar bg-content">
        <div v-if="previewLoading" class="p-20 flex justify-center opacity-30">
          <NLoading />
        </div>
        <template v-else>
          <table class="w-full text-left text-[11px] border-collapse min-w-max">
            <thead class="sticky top-0 z-10 bg-surface border-b border-base">
              <tr class="text-muted uppercase text-[9px] font-bold tracking-widest">
                <th class="px-4 py-3 w-28 text-center border-r border-base">Actions</th>
                <th v-for="key in previewColumns" :key="key" class="px-4 py-3">{{ key }}</th>
              </tr>
            </thead>
            <tbody class="divide-y border-base dark:divide-zinc-800/50 font-mono text-base">
              <tr v-for="(row, idx) in previewData" :key="idx" class="hover:bg-primary/5 transition-colors">
                <td class="p-0 border-r border-base align-middle">
                  <div class="flex items-center justify-center gap-2">
                    <button class="p-1.5 text-muted hover:text-primary transition-colors bg-transparent border-none cursor-pointer" title="View" @click="openEditor('view', row)">
                      <svg class="w-4 h-4" viewBox="0 0 32 32" fill="currentColor">
                        <path :d="ICONS.view" />
                      </svg>
                    </button>
                    <button class="p-1.5 text-muted hover:text-primary transition-colors bg-transparent border-none cursor-pointer" title="Edit" @click="openEditor('update', row)">
                      <svg class="w-4 h-4" viewBox="0 0 32 32" fill="currentColor">
                        <path :d="ICONS.edit" />
                      </svg>
                    </button>
                    <button class="p-1.5 text-muted hover:text-red-500 transition-colors bg-transparent border-none cursor-pointer" title="Delete" @click="deleteItem(row)">
                      <svg class="w-4 h-4" viewBox="0 0 32 32" fill="currentColor">
                        <path :d="ICONS.trash" />
                      </svg>
                    </button>
                  </div>
                </td>
                <td v-for="key in previewColumns" :key="key" class="px-4 py-2.5 truncate max-w-[300px] opacity-90 text-[11px]">
                  {{ row[key] }}
                </td>
              </tr>
            </tbody>
          </table>
        </template>
      </div>
    </div>
    <DataEditor v-model:editor="editor" @refresh="refreshEntityData" />
  </div>
</template>
