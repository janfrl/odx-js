<script setup lang="ts">
import { ref, onMounted, computed, watchEffect } from 'vue'
import { useDevtoolsClient } from '@nuxt/devtools-kit/iframe-client'

interface SapService {
  name: string
  route?: string
  entities?: string[]
  isGenerated?: boolean
}

interface SapConfig {
  basePath: string
  mode: string
  services: SapService[]
  forwardAuthHeader: boolean
  versions: { node: string, module: string }
}

const devtoolsClient = useDevtoolsClient()

// Synchronisiere die .dark Klasse am Root-Element des Iframes
watchEffect(() => {
  const mode = devtoolsClient.value?.devtools?.colorMode?.value
  if (!mode) return

  const isDark = mode === 'dark'
  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('dark', isDark)
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light'
  }
})

// --- STATE ---
const activeTab = ref('services')
const logs = ref<Record<string, unknown>[]>([])
const config = ref<SapConfig>({
  basePath: '/api/sap-odata',
  mode: 'sdk',
  services: [],
  forwardAuthHeader: true,
  versions: { node: '', module: '1.0.0' },
})

const selectedService = ref<SapService | null>(null)
const selectedEntity = ref<string | null>(null)
const generatingStatus = ref<Record<string, boolean>>({})
const previewLoading = ref(false)
const previewError = ref<string | null>(null)
const previewData = ref<Record<string, unknown>[]>([])
const queryParams = ref({ id: '', filter: '', select: '', top: 50 })

const editor = ref({
  show: false,
  mode: 'view' as 'view' | 'create' | 'update',
  json: '',
  loading: false,
  error: null as string | null,
  original: null as Record<string, unknown> | null,
})

async function fetchConfig() {
  try {
    const res = await fetch('/__sap_odata__/config')
    const data = (await res.json()) as SapConfig
    config.value = data
    if (selectedService.value) {
      const updated = data.services.find((s: SapService) => s.name === selectedService.value?.name)
      if (updated) {
        selectedService.value = updated
      }
    }
  }
  catch {
    // Silent fail for config fetch
  }
}

async function refreshLogs() {
  try {
    const res = await fetch('/__sap_odata__/logs')
    if (res.ok) {
      logs.value = (await res.json()) as Record<string, unknown>[]
    }
  }
  catch {
    // Silent fail for logs refresh
  }
}

async function generateService(name: string) {
  generatingStatus.value[name] = true
  try {
    const res = await fetch(`/__sap_odata__/generate?service=${name}`)
    const data = (await res.json()) as { success: boolean }
    if (data.success) {
      await fetchConfig()
    }
  }
  finally {
    generatingStatus.value[name] = false
  }
}

async function selectEntity(entity: string) {
  selectedEntity.value = entity
  queryParams.value.id = ''
  await refreshEntityData()
}

async function refreshEntityData() {
  if (!selectedService.value || !selectedEntity.value) {
    return
  }
  previewLoading.value = true
  previewError.value = null
  try {
    const route = selectedService.value.route || selectedService.value.name.toLowerCase()
    const url = new URL(`${window.location.origin}${config.value.basePath}/${route}/${selectedEntity.value}`)
    if (queryParams.value.id) {
      url.searchParams.set('id', queryParams.value.id)
    }
    else {
      if (queryParams.value.filter) {
        url.searchParams.set('$filter', queryParams.value.filter)
      }
      if (queryParams.value.select) {
        url.searchParams.set('$select', queryParams.value.select)
      }
      if (queryParams.value.top) {
        url.searchParams.set('$top', queryParams.value.top.toString())
      }
    }
    const res = await fetch(url.toString())
    const data = await res.json()
    previewData.value = Array.isArray(data) ? data : (data.value || [data])
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
    json: row ? JSON.stringify(row, null, 2) : '{\n  "ID": "",\n  "Name": ""\n}',
  }
}

async function saveItem() {
  if (!selectedService.value || !selectedEntity.value) {
    return
  }
  editor.value.loading = true
  editor.value.error = null
  try {
    const payload = JSON.parse(editor.value.json) as Record<string, unknown>
    const route = selectedService.value.route || selectedService.value.name.toLowerCase()
    const idKey = editor.value.original ? Object.keys(editor.value.original as Record<string, unknown>).find(k => k.toLowerCase() === 'id') : null
    const id = idKey ? (editor.value.original as Record<string, unknown>)[idKey] : null
    const res = await fetch(`${config.value.basePath}/${route}/${selectedEntity.value}${id ? `?id=${id}` : ''}`, {
      method: id ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      throw new Error(`Server Error ${res.status}`)
    }
    editor.value.show = false
    await refreshEntityData()
  }
  catch (e: unknown) {
    editor.value.error = (e as Error).message
  }
  finally {
    editor.value.loading = false
  }
}

async function deleteItem(row: Record<string, unknown>) {
  if (!selectedService.value || !selectedEntity.value) {
    return
  }
  const idKey = Object.keys(row).find(k => k.toLowerCase() === 'id')
  const id = idKey ? row[idKey] : null
  if (!id || !confirm(`Delete item ${id}?`)) {
    return
  }
  try {
    const route = selectedService.value.route || selectedService.value.name.toLowerCase()
    const res = await fetch(`${config.value.basePath}/${route}/${selectedEntity.value}?id=${id}`, {
      method: 'DELETE',
    })
    if (res.ok) {
      await refreshEntityData()
    }
  }
  catch (e: unknown) {
    alert((e as Error).message)
  }
}

async function clearLogs() {
  try {
    await fetch('/__sap_odata__/logs', { method: 'DELETE' })
    logs.value = []
  }
  catch {
    // Silent fail
  }
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
  <div class="h-screen flex bg-white dark:bg-[#050505] text-zinc-700 dark:text-zinc-400 overflow-hidden font-sans select-none border-t border-zinc-200 dark:border-zinc-800">
    <!-- Sidebar -->
    <aside class="w-14 border-r border-zinc-200 dark:border-zinc-800 flex flex-col items-center py-4 gap-2 bg-zinc-50 dark:bg-zinc-900/20 shrink-0">
      <button
        v-for="tab in [{ id: 'overview', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' }, { id: 'services', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' }, { id: 'logs', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' }]"
        :key="tab.id"
        :class="activeTab === tab.id ? 'text-[#00dc82] bg-[#00dc82]/10' : 'text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'"
        class="p-2.5 rounded-lg transition-colors relative group border-0 bg-transparent cursor-pointer"
        @click="activeTab = tab.id"
      >
        <svg
          class="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          stroke-width="1.5"
        ><path
          stroke-linecap="round"
          stroke-linejoin="round"
          :d="tab.icon"
        /></svg>
        <span
          v-if="tab.id === 'logs' && logs.length"
          class="absolute top-1 right-1 bg-[#00dc82] text-white dark:text-[#050505] text-[8px] px-1.5 py-0.5 rounded-full font-bold shadow-sm border border-[#00dc82]/20"
        >{{ logs.length }}</span>
      </button>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col min-w-0 overflow-hidden relative">
      <header class="h-12 border-b border-zinc-200 dark:border-zinc-800 flex items-center px-6 bg-zinc-50/50 dark:bg-[#0a0a0a] shrink-0 justify-between">
        <div class="flex items-center gap-3">
          <div class="text-[#00dc82]/80">
            <svg
              viewBox="0 0 24 24"
              class="w-5 h-5 fill-current opacity-80"
            ><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
          </div>
          <span class="font-bold text-[10px] tracking-[0.2em] uppercase text-zinc-500 dark:text-zinc-400">SAP OData <span class="font-normal opacity-40 text-[9px]">Explorer</span></span>
        </div>
        <div
          v-if="selectedService"
          class="text-[10px] font-mono text-[#00dc82]/60 uppercase tracking-widest"
        >
          {{ selectedService.name }}
        </div>
      </header>

      <div class="flex-1 overflow-hidden flex flex-col">
        <!-- Tab: Overview -->
        <div
          v-if="activeTab === 'overview'"
          class="flex-1 overflow-auto flex flex-col min-h-0"
        >
          <div class="p-10 space-y-10 shrink-0">
            <div class="flex items-center gap-5">
              <svg
                viewBox="0 0 24 24"
                class="w-10 h-10 fill-[#00dc82] opacity-90"
              ><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
              <div>
                <h1 class="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight leading-none mb-1.5">
                  SAP OData
                </h1>
                <p class="text-zinc-400 dark:text-zinc-500 text-xs font-medium">
                  Nuxt SAP Cloud SDK Integration
                </p>
              </div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div
                v-for="card in [{ l: 'Status', v: 'Active', c: 'text-green-500', i: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' }, { l: 'Mode', v: config.mode, c: 'text-[#00dc82] uppercase', i: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4' }, { l: 'Base Path', v: config.basePath, c: 'text-zinc-500', i: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1' }, { l: 'Services', v: services.length, c: 'text-zinc-500', i: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' }]"
                :key="card.l"
                class="bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/60 p-6 rounded-2xl border-dashed"
              >
                <div class="flex items-center justify-between opacity-30 mb-4 text-[9px] uppercase font-bold tracking-widest">
                  <span>{{ card.l }}</span><svg
                    class="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  ><path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="1.5"
                    :d="card.i"
                  /></svg>
                </div>
                <div
                  :class="card.c"
                  class="text-sm font-mono font-medium"
                >
                  {{ card.v }}
                </div>
              </div>
            </div>
          </div>
          <div class="flex-1 grid grid-cols-1 md:grid-cols-2 gap-px bg-zinc-200 dark:bg-zinc-800 border-t border-zinc-200 dark:border-zinc-800">
            <div class="bg-zinc-50 dark:bg-[#0a0a0a] p-10 space-y-6">
              <h3 class="text-[10px] font-bold uppercase tracking-[0.2em] opacity-30">
                Configuration
              </h3>
              <div class="space-y-4 max-w-md">
                <div class="flex justify-between items-center text-sm border-b border-zinc-100 dark:border-zinc-800 pb-4">
                  <span class="opacity-50">Auth Forwarding</span><span
                    :class="config.forwardAuthHeader ? 'text-green-500' : 'text-orange-500'"
                    class="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm"
                  >{{ config.forwardAuthHeader ? 'Enabled' : 'Disabled' }}</span>
                </div>
                <div class="flex justify-between items-center text-sm pt-2">
                  <span class="opacity-50">Build Path</span><span class="font-mono text-[10px] opacity-40">.nuxt/sap-odata/generated</span>
                </div>
              </div>
            </div>
            <div class="bg-zinc-50 dark:bg-[#0a0a0a] p-10 space-y-6">
              <h3 class="text-[10px] font-bold uppercase tracking-[0.2em] opacity-30">
                Environment
              </h3>
              <div class="space-y-4 max-w-md">
                <div class="flex justify-between items-center text-sm border-b border-zinc-100 dark:border-zinc-800 pb-4">
                  <span class="opacity-50">Module Version</span><span class="font-mono text-xs text-[#00dc82]">v1.0.0</span>
                </div>
                <div class="flex justify-between items-center text-sm pt-2">
                  <span class="opacity-50">Node.js Runtime</span><span class="font-mono text-xs opacity-60">{{ config.versions?.node || '...' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab: Services -->
        <div
          v-if="activeTab === 'services'"
          class="flex-1 flex flex-col min-h-0 bg-base"
        >
          <div
            v-if="!selectedService"
            class="p-8 space-y-8 overflow-auto"
          >
            <h1 class="text-base font-medium opacity-80 text-zinc-900 dark:text-zinc-100">
              Available Services
            </h1>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div
                v-for="svc in services"
                :key="svc.name"
                class="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 hover:border-[#00dc82]/40 group cursor-pointer shadow-sm relative border-dashed"
                @click="selectedService = svc"
              >
                <div class="flex items-start gap-4 mb-4">
                  <div class="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 text-zinc-400 group-hover:text-[#00dc82]">
                    <svg
                      class="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    ><path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="1.5"
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    /></svg>
                  </div>
                  <div class="min-w-0">
                    <div class="flex items-center gap-2 mb-0.5">
                      <h2 class="font-bold text-zinc-900 dark:text-zinc-100 truncate leading-none">
                        {{ svc.name }}
                      </h2>
                      <span
                        class="w-1.5 h-1.5 rounded-full shrink-0"
                        :class="svc.isGenerated ? 'bg-[#00dc82] shadow-[0_0_8px_rgba(0,220,130,0.4)]' : 'bg-amber-500 opacity-40'"
                      />
                    </div>
                    <div class="text-[10px] text-zinc-400 font-mono truncate opacity-60">
                      {{ config.basePath }}/{{ svc.route || svc.name.toLowerCase() }}
                    </div>
                  </div>
                </div>
                <div class="flex items-center justify-between text-[9px] uppercase tracking-widest font-bold opacity-20 mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800/50">
                  <span>SDK Status</span><span>{{ svc.isGenerated ? 'Generated' : 'Missing' }}</span>
                </div>
              </div>
            </div>
          </div>

          <div
            v-else
            class="flex-1 flex flex-col min-h-0 overflow-hidden pt-8 px-8"
          >
            <header class="flex items-center gap-4 mb-8">
              <button
                class="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors border-0 bg-transparent cursor-pointer"
                @click="selectedService = null; selectedEntity = null"
              >
                <svg
                  class="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                ><path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 19l-7-7 7-7"
                /></svg>
              </button>
              <div class="min-w-0 flex-1">
                <h2 class="text-base font-bold text-zinc-900 dark:text-zinc-100 truncate mb-0.5 leading-none">
                  {{ selectedService.name }}
                </h2><div class="text-[10px] text-zinc-400 font-mono opacity-60">
                  {{ config.basePath }}/{{ selectedService.route || selectedService.name.toLowerCase() }}
                </div>
              </div>
              <button
                :disabled="generatingStatus[selectedService.name]"
                class="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 text-[10px] font-bold uppercase tracking-widest border border-zinc-200 dark:border-zinc-800 transition-all disabled:opacity-50 bg-transparent cursor-pointer"
                @click="generateService(selectedService.name)"
              >
                <span>Sync SDK</span>
              </button>
            </header>
            <div class="flex gap-1 overflow-x-auto no-scrollbar border-b border-zinc-100 dark:border-zinc-800 pb-px mb-6">
              <button
                v-for="entity in (selectedService.entities || [])"
                :key="entity"
                :class="selectedEntity === entity ? 'text-[#00dc82] border-[#00dc82]' : 'text-zinc-400 border-transparent hover:text-zinc-600 dark:hover:text-zinc-200'"
                class="px-4 py-2 text-[11px] font-mono border-b-2 transition-all whitespace-nowrap font-bold bg-transparent cursor-pointer"
                @click="selectEntity(entity)"
              >
                {{ entity }}
              </button>
            </div>

            <div
              v-if="selectedEntity"
              class="flex-1 flex flex-col min-h-0 bg-zinc-50 dark:bg-[#0a0a0a] rounded-t-2xl overflow-hidden shadow-xl shadow-black/5"
            >
              <div class="px-6 py-3 flex flex-wrap gap-4 items-end shrink-0 border-b border-zinc-100 dark:border-zinc-800/50 bg-white/50 dark:bg-[#0c0c0d]">
                <div class="flex flex-col gap-1 w-20">
                  <label class="text-[9px] uppercase font-bold text-zinc-400 dark:text-zinc-600 tracking-widest px-0.5">Key</label><input
                    v-model="queryParams.id"
                    type="text"
                    placeholder="Key"
                    :class="queryParams.filter.length > 0 ? 'opacity-20 pointer-events-none' : ''"
                    class="h-7 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-2 font-mono text-[11px] focus:border-[#00dc82]/50 outline-none w-full text-zinc-900 dark:text-zinc-100"
                    @keyup.enter="refreshEntityData"
                  >
                </div>
                <div class="flex flex-col gap-1 flex-1 min-w-[200px]">
                  <label class="text-[9px] uppercase font-bold text-zinc-400 dark:text-zinc-600 tracking-widest px-0.5">Filter</label><input
                    v-model="queryParams.filter"
                    type="text"
                    placeholder="Name eq 'Test'"
                    :class="queryParams.id.length > 0 ? 'opacity-20 pointer-events-none' : ''"
                    class="h-7 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-2 font-mono text-[11px] focus:border-[#00dc82]/50 outline-none w-full text-zinc-900 dark:text-zinc-100"
                    @keyup.enter="refreshEntityData"
                  >
                </div>
                <div class="flex items-center gap-2">
                  <button
                    class="h-7 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 text-[10px] font-bold uppercase px-4 rounded border border-zinc-200 dark:border-zinc-700 cursor-pointer"
                    @click="refreshEntityData"
                  >
                    Run
                  </button><button
                    class="h-7 bg-[#00dc82] hover:bg-[#00dc82]/90 text-[#0c0c0d] text-[10px] font-bold uppercase px-4 rounded shadow-sm flex items-center gap-2 cursor-pointer"
                    @click="openEditor('create')"
                  >
                    <span>Add</span>
                  </button>
                </div>
              </div>
              <div class="flex-1 overflow-auto custom-scrollbar bg-white dark:bg-[#0c0c0d]">
                <div
                  v-if="previewLoading"
                  class="flex items-center justify-center p-20 opacity-30"
                >
                  <svg
                    class="animate-spin h-8 w-8 text-[#00dc82]"
                    viewBox="0 0 24 24"
                  ><path
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  /></svg>
                </div>
                <div v-else>
                  <table class="w-full text-left text-[11px] border-collapse min-w-max">
                    <thead>
                      <tr class="text-zinc-400 uppercase text-[9px] font-bold tracking-widest border-b border-zinc-100 dark:border-zinc-800 sticky top-0 bg-white dark:bg-zinc-900 z-10 shadow-sm">
                        <th class="py-4 w-28 text-center border-r border-zinc-100 dark:border-zinc-800">
                          Actions
                        </th><th
                          v-for="key in previewColumns"
                          :key="key"
                          class="px-4 py-4"
                        >
                          {{ key }}
                        </th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-zinc-100 dark:divide-zinc-800 font-mono text-zinc-500 dark:text-zinc-400/80">
                      <tr
                        v-for="(row, idx) in previewData"
                        :key="idx"
                        class="hover:bg-[#00dc82]/5 transition-colors h-12"
                      >
                        <td class="p-0 border-r border-zinc-100 dark:border-zinc-800 align-middle">
                          <div class="flex items-center justify-center gap-3 h-full">
                            <button
                              class="opacity-30 hover:opacity-100 hover:text-[#00dc82] p-1 bg-transparent border-0 cursor-pointer"
                              title="View"
                              @click="openEditor('view', row)"
                            >
                              <svg
                                class="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                stroke-width="2"
                              ><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            </button><button
                              class="opacity-30 hover:opacity-100 hover:text-[#00dc82] p-1 bg-transparent border-0 cursor-pointer"
                              title="Edit"
                              @click="openEditor('update', row)"
                            >
                              <svg
                                class="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                stroke-width="2"
                              ><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                            </button><button
                              class="opacity-30 hover:opacity-100 hover:text-red-500 p-1 bg-transparent border-0 cursor-pointer"
                              title="Delete"
                              @click="deleteItem(row)"
                            >
                              <svg
                                class="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                stroke-width="2"
                              ><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                        </td>
                        <td
                          v-for="key in previewColumns"
                          :key="key"
                          class="px-4 py-3 truncate max-w-[350px] align-middle text-zinc-900 dark:text-zinc-100"
                        >
                          {{ row[key] }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab: Logs -->
        <div
          v-if="activeTab === 'logs'"
          class="flex-1 flex flex-col min-h-0 bg-white dark:bg-[#050505] pt-8 px-8"
        >
          <div class="flex justify-between items-center mb-8 shrink-0">
            <h1 class="text-base font-medium opacity-80 text-zinc-900 dark:text-zinc-100">
              Traffic Monitor
            </h1>
            <button
              class="text-[10px] text-zinc-400 hover:text-[#00dc82] transition-colors uppercase tracking-[0.2em] font-bold border-b border-dashed border-current pb-0.5 bg-transparent cursor-pointer"
              @click="clearLogs"
            >
              Purge History
            </button>
          </div>
          <div class="flex-1 flex flex-col min-h-0 bg-zinc-50 dark:bg-[#0a0a0a] rounded-t-2xl overflow-hidden shadow-xl shadow-black/5">
            <div class="flex-1 overflow-auto custom-scrollbar bg-white dark:bg-[#0c0c0d]">
              <table class="w-full text-[11px] text-left border-collapse">
                <thead class="bg-zinc-50 dark:bg-zinc-900 text-zinc-400 uppercase text-[9px] font-bold tracking-widest border-b border-zinc-100 dark:border-zinc-800 sticky top-0 shadow-sm z-10">
                  <tr>
                    <th class="px-6 py-4">
                      Status
                    </th><th class="px-6 py-4">
                      Method
                    </th><th class="px-6 py-4">
                      Path
                    </th><th class="px-4 py-4 text-right">
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-zinc-100 dark:divide-zinc-800 font-mono text-zinc-500">
                  <tr
                    v-for="log in logs"
                    :key="log.id"
                    class="hover:bg-[#00dc82]/5 transition-colors"
                  >
                    <td class="px-6 py-4">
                      <span
                        :class="log.status < 400 ? 'text-[#00dc82]' : 'text-red-500'"
                        class="font-bold opacity-80"
                      >{{ log.status }}</span>
                    </td><td class="px-6 py-4 opacity-50 uppercase text-[10px] tracking-tighter">
                      {{ log.method }}
                    </td><td class="px-6 py-4 truncate max-w-[400px] text-zinc-800 dark:text-zinc-200 font-medium tracking-tight">
                      {{ log.service }}/{{ log.entitySet || '-' }}
                    </td><td class="px-4 py-4 text-right opacity-40 italic">
                      {{ log.duration }}ms
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Editor Sidebar -->
    <div
      v-if="editor.show"
      class="fixed inset-0 z-[100] flex justify-end overflow-hidden"
    >
      <Transition
        appear
        name="fade"
      >
        <div
          class="absolute inset-0 bg-black/40 backdrop-blur-[1px] pointer-events-auto"
          @click="editor.show = false"
        />
      </Transition>
      <Transition
        appear
        name="slide"
      >
        <div class="w-full max-w-2xl bg-white dark:bg-[#0a0a0a] h-full shadow-2xl flex flex-col border-l border-zinc-200 dark:border-zinc-800 relative z-[101] pointer-events-auto">
          <header class="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/20 text-zinc-900 dark:text-zinc-100">
            <div>
              <h3 class="font-bold text-lg capitalize mb-1">
                {{ editor.mode }} Item
              </h3><p class="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono tracking-widest uppercase opacity-60">
                {{ selectedEntity }}
              </p>
            </div><button
              class="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl text-zinc-400 transition-all border-0 shadow-none bg-transparent cursor-pointer"
              @click="editor.show = false"
            >
              <svg
                class="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              ><path d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </header>
          <div class="flex-1 p-8 overflow-hidden flex flex-col">
            <div class="text-[9px] uppercase font-bold text-zinc-400 dark:text-zinc-600 mb-3 tracking-[0.2em]">
              Data Payload
            </div><textarea
              v-model="editor.json"
              :readonly="editor.mode === 'view'"
              class="flex-1 bg-zinc-50 dark:bg-black border border-zinc-100 dark:border-zinc-800 rounded-xl p-6 font-mono text-[11px] focus:border-[#00dc82]/30 outline-none resize-none text-zinc-600 dark:text-[#00dc82]/80 leading-relaxed custom-scrollbar shadow-inner"
            /><div
              v-if="editor.error"
              class="mt-4 p-4 bg-red-500/5 text-red-500 text-[10px] rounded border border-red-500/10 font-bold"
            >
              {{ editor.error }}
            </div>
          </div>
          <footer
            v-if="editor.mode !== 'view'"
            class="p-6 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-3 bg-zinc-50 dark:bg-zinc-900/20"
          >
            <button
              class="px-5 py-2 text-xs text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors font-medium bg-transparent border-0 cursor-pointer"
              @click="editor.show = false"
            >
              Cancel
            </button><button
              :disabled="editor.loading"
              class="px-6 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black text-[11px] font-bold rounded shadow-lg active:scale-95 transition-all disabled:opacity-50 uppercase tracking-widest cursor-pointer border-0"
              @click="saveItem"
            >
              <template v-if="editor.loading">
                ...
              </template>
              <template v-else>
                {{ editor.mode === 'create' ? 'Create' : 'Save' }}
              </template>
            </button>
          </footer>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style>
html, body, #__nuxt {
  margin: 0 !important;
  padding: 0 !important;
  height: 100% !important;
  width: 100% !important;
  overflow: hidden !important;
}
button { font-family: inherit; }
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
.custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #e4e4e7; border-radius: 10px; }
.dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #18181b; }
.slide-enter-active, .slide-leave-active { transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
.slide-enter-from, .slide-leave-to { transform: translateX(100%); }
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
