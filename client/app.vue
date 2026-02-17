<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

const activeTab = ref('services')
const logs = ref<any[]>([])
const config = ref({
  basePath: '/api/sap-odata',
  mode: 'sdk',
  services: [],
  forwardAuthHeader: true
})

const selectedService = ref<any>(null)
const selectedEntity = ref<string | null>(null)
const generatingStatus = ref<Record<string, boolean>>({})
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
  original: null as any
})

async function fetchConfig() {
  try {
    const res = await fetch('/__sap_odata__/config')
    const data = await res.json()
    config.value = data
    if (selectedService.value) {
      const updated = data.services.find((s: any) => s.name === selectedService.value.name)
      if (updated) selectedService.value = updated
    }
  } catch (e) { console.error('fetchConfig failed', e) }
}

async function refreshLogs() {
  try {
    const res = await fetch('/__sap_odata__/logs')
    if (res.ok) logs.value = await res.json()
  } catch (e) {}
}

async function generateService(name: string) {
  generatingStatus.value[name] = true
  try {
    const res = await fetch(`/__sap_odata__/generate?service=${name}`)
    if ((await res.json()).success) await fetchConfig()
  } catch (e) {}
  finally { generatingStatus.value[name] = false }
}

async function selectEntity(entity: string) {
  selectedEntity.value = entity
  queryParams.value.id = ''
  await refreshEntityData()
}

async function refreshEntityData() {
  if (!selectedService.value || !selectedEntity.value) return
  previewLoading.value = true; previewError.value = null
  try {
    const route = selectedService.value.route || selectedService.value.name.toLowerCase()
    const url = new URL(`${window.location.origin}${config.value.basePath}/${route}/${selectedEntity.value}`)
    if (queryParams.value.id) url.searchParams.set('id', queryParams.value.id)
    else {
      if (queryParams.value.filter) url.searchParams.set('$filter', queryParams.value.filter)
      if (queryParams.value.select) url.searchParams.set('$select', queryParams.value.select)
      if (queryParams.value.top) url.searchParams.set('$top', queryParams.value.top.toString())
    }
    const res = await fetch(url.toString())
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    previewData.value = Array.isArray(data) ? data : (data.value || [data])
  } catch (e: any) { previewError.value = e.message }
  finally { previewLoading.value = false }
}

function openEditor(mode: 'view' | 'create' | 'update', row: any = null) {
  editor.value = {
    show: true, mode, error: null, loading: false, original: row,
    json: row ? JSON.stringify(row, null, 2) : '{\n  "ID": "1",\n  "Name": "New Item"\n}'
  }
}

async function saveItem() {
  editor.value.loading = true; editor.value.error = null
  try {
    const payload = JSON.parse(editor.value.json)
    const route = selectedService.value.route || selectedService.value.name.toLowerCase()
    const idKey = editor.value.original ? Object.keys(editor.value.original).find(k => k.toLowerCase() === 'id') : null
    const id = idKey ? editor.value.original[idKey] : null
    const url = `${config.value.basePath}/${route}/${selectedEntity.value}${id ? `?id=${id}` : ''}`
    const res = await fetch(url, {
      method: id ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    if (!res.ok) throw new Error(`Server Error ${res.status}`)
    editor.value.show = false; await refreshEntityData()
  } catch (e: any) { editor.value.error = e.message }
  finally { editor.value.loading = false }
}

async function deleteItem(row: any) {
  const idKey = Object.keys(row).find(k => k.toLowerCase() === 'id')
  const id = idKey ? row[idKey] : null
  if (!id || !confirm(`Delete item ${id}?`)) return
  try {
    const route = selectedService.value.route || selectedService.value.name.toLowerCase()
    const res = await fetch(`${config.value.basePath}/${route}/${selectedEntity.value}?id=${id}`, { method: 'DELETE' })
    if (res.ok) await refreshEntityData()
  } catch (e: any) { alert(e.message) }
}

const services = computed(() => config.value.services || [])
const previewColumns = computed(() => (previewData.value && previewData.value.length) ? Object.keys(previewData.value[0]).filter(k => k !== '__metadata') : [])

onMounted(() => {
  fetchConfig()
  refreshLogs()
  setInterval(refreshLogs, 3000)
})
</script>

<template>
  <div class="h-screen flex bg-white dark:bg-[#0c0c0d] text-zinc-900 dark:text-zinc-200 overflow-hidden font-sans select-none border-t border-zinc-200 dark:border-zinc-800">
    <!-- Sidebar -->
    <aside class="w-16 border-r border-zinc-200 dark:border-zinc-800 flex flex-col items-center py-4 gap-4 bg-zinc-50 dark:bg-zinc-900/20 shrink-0">
      <div class="mb-4 text-blue-600 dark:text-blue-500">
        <svg viewBox="0 0 24 24" class="w-8 h-8 fill-current"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
      </div>
      <button 
        v-for="tab in [{id:'overview', icon:'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'}, {id:'services', icon:'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10'}, {id:'logs', icon:'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'}]"
        :key="tab.id"
        @click="activeTab = tab.id"
        :class="activeTab === tab.id ? 'text-blue-600 dark:text-blue-400 bg-blue-500/10' : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'"
        class="p-3 rounded-xl transition-all relative group"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" :d="tab.icon" />
        </svg>
        <span v-if="tab.id === 'logs' && logs.length" class="absolute top-2 right-2 bg-blue-500 text-white text-[8px] px-1 rounded-full">{{ logs.length }}</span>
      </button>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col min-w-0 overflow-hidden relative">
      
      <!-- Tab: Overview -->
      <div v-if="activeTab === 'overview'" class="flex-1 overflow-auto p-8 space-y-8">
        <h1 class="text-xl font-bold text-zinc-900 dark:text-zinc-100">Module Overview</h1>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div v-for="card in [{l:'Status', v:'Active', c:'text-green-600 dark:text-green-400'}, {l:'Mode', v:config.mode, c:'text-blue-600 dark:text-blue-400 uppercase'}, {l:'Base Path', v:config.basePath, c:'text-purple-600 dark:text-purple-400'}]" class="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-2xl shadow-sm">
            <div class="text-[10px] uppercase font-bold text-zinc-500 mb-2 tracking-widest">{{ card.l }}</div>
            <div :class="card.c" class="text-lg font-mono font-bold">{{ card.v }}</div>
          </div>
        </div>
      </div>

      <!-- Tab: Services -->
      <div v-if="activeTab === 'services'" class="flex-1 flex flex-col min-h-0 overflow-hidden">
        <!-- Master List -->
        <div v-if="!selectedService" class="p-8 space-y-6 overflow-auto">
          <h1 class="text-xl font-bold text-zinc-900 dark:text-zinc-100">SAP OData Services</h1>
          <div class="grid gap-4">
            <div v-for="svc in services" :key="svc.name" @click="selectedService = svc" class="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 hover:border-blue-500/50 transition-all group cursor-pointer flex items-center justify-between shadow-sm">
              <div class="flex items-center gap-4">
                <div class="bg-zinc-200 dark:bg-zinc-800 p-3 rounded-xl group-hover:bg-blue-500/10 transition-colors text-zinc-500 dark:text-zinc-400 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                </div>
                <div>
                  <div class="font-bold flex items-center gap-3 text-base text-zinc-900 dark:text-zinc-100">
                    {{ svc.name }}
                    <span :class="svc.isGenerated ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'" class="text-[9px] px-2 py-0.5 rounded border font-bold uppercase tracking-widest">{{ svc.isGenerated ? 'Active' : 'Missing' }}</span>
                  </div>
                  <div class="text-[11px] text-zinc-500 font-mono mt-1 opacity-60">{{ config.basePath }}/{{ svc.route || svc.name.toLowerCase() }}</div>
                </div>
              </div>
              <svg class="w-6 h-6 text-zinc-300 dark:text-zinc-700 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
            </div>
          </div>
        </div>

        <!-- Detail View -->
        <div v-else class="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div class="p-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/20">
            <header class="flex items-center gap-4 mb-6">
              <button @click="selectedService = null; selectedEntity = null" class="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-xl text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
              </button>
              <div class="min-w-0">
                <h2 class="text-xl font-bold text-zinc-900 dark:text-zinc-100 truncate leading-tight">{{ selectedService.name }}</h2>
                <div class="text-[11px] text-zinc-500 font-mono opacity-60">{{ config.basePath }}/{{ selectedService.route || selectedService.name.toLowerCase() }}</div>
              </div>
              <button @click="generateService(selectedService.name)" :disabled="generatingStatus[selectedService.name]" class="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-[11px] font-bold uppercase border border-zinc-300 dark:border-zinc-700/50 transition-all disabled:opacity-50">
                <svg v-if="generatingStatus[selectedService.name]" class="animate-spin h-4 w-4 text-blue-500" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                <span>{{ generatingStatus[selectedService.name] ? 'Generating...' : 'Regenerate SDK' }}</span>
              </button>
            </header>
            <div class="flex gap-2 overflow-x-auto no-scrollbar pb-2">
              <button v-for="entity in (selectedService.entities || [])" :key="entity" @click="selectEntity(entity)" :class="selectedEntity === entity ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-900/20' : 'bg-white dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 shadow-sm'" class="px-5 py-2 text-[11px] font-mono border rounded-full transition-all whitespace-nowrap font-bold">{{ entity }}</button>
            </div>
          </div>

          <div v-if="selectedEntity" class="flex-1 flex flex-col min-h-0 bg-white dark:bg-zinc-950">
            <div class="bg-zinc-50 dark:bg-[#0c0c0d] border-b border-zinc-200 dark:border-zinc-800 p-4 flex flex-wrap gap-4 items-end shrink-0">
              <div class="flex flex-col gap-1.5 w-24">
                <label class="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-600 tracking-widest px-1">ID (Key)</label>
                <input v-model="queryParams.id" @keyup.enter="refreshEntityData" type="text" placeholder="Key" :class="queryParams.filter.length > 0 ? 'bg-zinc-100 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-900 text-zinc-400 dark:text-zinc-700 cursor-not-allowed opacity-50' : 'bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:border-blue-500'" class="h-9 border rounded-xl px-3 font-mono outline-none w-full transition-all placeholder:text-zinc-300 dark:placeholder:text-zinc-700" :disabled="queryParams.filter.length > 0">
              </div>
              <div class="flex flex-col gap-1.5 flex-1 min-w-[200px]">
                <label class="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-600 tracking-widest px-1">Filter</label>
                <input v-model="queryParams.filter" @keyup.enter="refreshEntityData" type="text" placeholder="Name eq 'Test'" :class="queryParams.id.length > 0 ? 'bg-zinc-100 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-900 text-zinc-400 dark:text-zinc-700 cursor-not-allowed opacity-50' : 'bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:border-blue-500'" class="h-9 border rounded-xl px-3 font-mono outline-none w-full transition-all placeholder:text-zinc-300 dark:placeholder:text-zinc-700" :disabled="queryParams.id.length > 0">
              </div>
              <div class="flex items-center gap-2">
                <button @click="refreshEntityData" class="h-9 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-100 text-xs font-bold uppercase px-6 rounded-xl border border-zinc-300 dark:border-zinc-700 transition-all shadow-sm">Run</button>
                <button @click="openEditor('create')" class="h-9 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase px-6 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-blue-900/20"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path d="M12 4v16m8-8H4" /></svg><span>Add Item</span></button>
              </div>
            </div>
            <div class="flex-1 overflow-auto relative custom-scrollbar">
              <div v-if="previewLoading" class="absolute inset-0 z-20 flex items-center justify-center bg-white/60 dark:bg-zinc-950/60 backdrop-blur-sm transition-all duration-300">
                <svg class="animate-spin h-10 w-10 text-blue-500" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              </div>
              <table v-else class="w-full text-left text-[11px] border-collapse min-w-max">
                <thead class="bg-zinc-50 dark:bg-zinc-900 sticky top-0 z-10 text-zinc-500 uppercase text-[10px] font-bold border-b border-zinc-200 dark:border-zinc-800 shadow-sm">
                  <tr><th class="px-6 py-4 w-36 text-center border-r border-zinc-200 dark:border-zinc-800">Actions</th><th v-for="key in previewColumns" :key="key" class="px-6 py-4 border-r border-zinc-200 dark:border-zinc-800 last:border-0">{{ key }}</th></tr>
                </thead>
                <tbody class="divide-y divide-zinc-200 dark:divide-zinc-800 font-mono text-zinc-600 dark:text-zinc-400">
                  <tr v-for="(row, idx) in previewData" :key="idx" class="hover:bg-blue-500/5 transition-colors h-12">
                    <td class="p-0 border-r border-zinc-200 dark:border-zinc-800">
                      <div class="flex items-center justify-center gap-4">
                        <button @click="openEditor('view', row)" class="text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg shadow-sm" title="View"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg></button>
                        <button @click="openEditor('update', row)" class="text-zinc-400 hover:text-green-600 dark:hover:text-emerald-400 p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg shadow-sm" title="Edit"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                        <button @click="deleteItem(row)" class="text-zinc-400 hover:text-red-600 dark:hover:text-red-400 p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg shadow-sm" title="Delete"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                      </div>
                    </td>
                    <td v-for="key in previewColumns" :key="key" class="px-6 py-3 border-r border-zinc-200 dark:border-zinc-800 last:border-0 truncate max-w-[350px] align-middle">{{ row[key] }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab: Logs -->
      <div v-if="activeTab === 'logs'" class="flex-1 overflow-auto p-8 flex flex-col min-h-0">
        <h1 class="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-8">Traffic Monitor</h1>
        <div class="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden flex-1 overflow-auto shadow-sm">
          <table class="w-full text-[11px] text-left">
            <thead class="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 uppercase text-[9px] font-bold tracking-widest border-b border-zinc-200 dark:border-zinc-800 sticky top-0 shadow-sm">
              <tr><th class="px-6 py-4">Status</th><th class="px-6 py-4">Method</th><th class="px-6 py-4">Entity Set</th><th class="px-4 py-4 text-right">Duration</th></tr>
            </thead>
            <tbody class="divide-y divide-zinc-200 dark:divide-zinc-800 font-mono text-zinc-600 dark:text-zinc-400">
              <tr v-for="log in logs" :key="log.id" class="hover:bg-blue-500/5 transition-colors">
                <td class="px-6 py-4"><span :class="log.status < 400 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'" class="font-bold">{{ log.status }}</span></td>
                <td class="px-6 py-4 opacity-70">{{ log.method }}</td>
                <td class="px-6 py-4">
                  <span class="text-zinc-900 dark:text-zinc-100 font-bold">{{ log.service }}</span>
                  <span class="text-zinc-300 dark:text-zinc-700 mx-1">/</span>
                  <span class="text-blue-600 dark:text-blue-400">{{ log.entitySet || '-' }}</span>
                </td>
                <td class="px-4 py-4 text-right text-zinc-500">{{ log.duration }}ms</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>

    <!-- Editor Sidebar -->
    <div v-if="editor.show" class="fixed inset-0 z-[100] flex justify-end">
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" @click="editor.show = false"></div>
      <div class="w-full max-w-2xl bg-white dark:bg-[#0c0c0d] h-full shadow-2xl flex flex-col border-l border-zinc-200 dark:border-zinc-800 relative z-[101]">
        <header class="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50 text-zinc-900 dark:text-zinc-100">
          <div><h3 class="font-bold text-lg capitalize leading-none mb-1">{{ editor.mode }} Item</h3><p class="text-[10px] text-zinc-500 font-mono uppercase tracking-widest opacity-60">{{ selectedEntity }}</p></div>
          <button @click="editor.show = false" class="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-xl text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-all"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg></button>
        </header>
        <div class="flex-1 p-6 overflow-hidden flex flex-col">
          <div class="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-600 mb-3 tracking-widest">Payload (JSON)</div>
          <textarea v-model="editor.json" :readonly="editor.mode === 'view'" class="flex-1 bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 font-mono text-xs focus:border-blue-500 outline-none resize-none text-blue-700 dark:text-blue-300 shadow-inner leading-relaxed"></textarea>
          <div v-if="editor.error" class="mt-4 p-4 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs rounded-xl font-bold">{{ editor.error }}</div>
        </div>
        <footer v-if="editor.mode !== 'view'" class="p-6 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-4 bg-zinc-50 dark:bg-zinc-900/20">
          <button @click="editor.show = false" class="px-6 py-2.5 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white font-bold transition-colors">Cancel</button>
          <button @click="saveItem" :disabled="editor.loading" class="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-3 shadow-lg shadow-blue-900/20 active:scale-95 disabled:opacity-50">
            <svg v-if="editor.loading" class="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            <span>{{ editor.mode === 'create' ? 'Create Record' : 'Save Changes' }}</span>
          </button>
        </footer>
      </div>
    </div>
  </div>
</template>

<style>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
.custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #d4d4d8; border-radius: 10px; }
.dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; }
</style>
