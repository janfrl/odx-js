<script setup lang="ts">
import { onDevtoolsClientConnected } from '@nuxt/devtools-kit/iframe-client'
import { ref, computed } from 'vue'

const client = ref<any>(null)
const logs = ref<any[]>([])
const activeTab = ref('overview')

onDevtoolsClientConnected(async (devtools) => {
  client.value = devtools
  
  // Example: How to get data via RPC if we define it in the module
  // For now, we still use the fetch fallback or wait for RPC setup
  refreshLogs()
  setInterval(refreshLogs, 3000)
})

async function refreshLogs() {
  const res = await fetch('/__sap_odata__/logs')
  logs.value = await res.json()
}

const services = computed(() => client.value?.host?.nuxt?.options?.odata?.services || [])
const publicConfig = computed(() => client.value?.host?.nuxt?.options?.runtimeConfig?.public?.odata || {})
</script>

<template>
  <div class="h-screen flex flex-col bg-zinc-950 text-zinc-200 font-sans">
    <!-- Header -->
    <header class="h-12 border-b border-zinc-800 flex items-center px-4 shrink-0 bg-zinc-900/50 justify-between">
      <div class="flex items-center gap-2">
        <NIcon name="logos:sap" class="text-xl" />
        <span class="font-bold text-sm tracking-tight">SAP OData <span class="text-zinc-500 font-normal underline decoration-blue-500/30">Explorer</span></span>
      </div>
    </header>

    <div class="flex flex-1 overflow-hidden">
      <!-- Sidebar -->
      <aside class="w-48 border-r border-zinc-800 p-2 flex flex-col gap-1 bg-zinc-900/20">
        <button 
          @click="activeTab = 'overview'" 
          :class="activeTab === 'overview' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300'"
          class="flex items-center gap-2 px-3 py-1.5 text-xs rounded-md transition-all"
        >
          <NIcon name="carbon:dashboard" />
          Overview
        </button>
        <button 
          @click="activeTab = 'services'" 
          :class="activeTab === 'services' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300'"
          class="flex items-center gap-2 px-3 py-1.5 text-xs rounded-md transition-all"
        >
          <NIcon name="carbon:cloud-service-management" />
          Services
        </button>
        <button 
          @click="activeTab = 'logs'" 
          :class="activeTab === 'logs' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300'"
          class="flex items-center gap-2 px-3 py-1.5 text-xs rounded-md transition-all"
        >
          <NIcon name="carbon:list" />
          Request Logs
          <span v-if="logs.length" class="ml-auto bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full text-[9px]">{{ logs.length }}</span>
        </button>
      </aside>

      <!-- Main -->
      <main class="flex-1 overflow-auto p-6">
        <div v-if="activeTab === 'overview'">
          <div class="grid grid-cols-3 gap-4 mb-8">
            <div class="bg-zinc-900 border border-zinc-800 p-4 rounded-lg">
              <div class="text-[10px] uppercase font-bold text-zinc-500 mb-1">Base Path</div>
              <div class="text-blue-400 font-mono text-sm">{{ publicConfig.basePath || '/api/sap-odata' }}</div>
            </div>
            <div class="bg-zinc-900 border border-zinc-800 p-4 rounded-lg">
              <div class="text-[10px] uppercase font-bold text-zinc-500 mb-1">Mode</div>
              <div class="text-emerald-400 font-mono text-sm uppercase">{{ publicConfig.mode || 'sdk' }}</div>
            </div>
          </div>

          <div class="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
            <div class="px-4 py-2 border-b border-zinc-800 bg-zinc-800/30 text-xs font-bold">Project Context</div>
            <div class="p-4 space-y-3 text-xs">
              <div class="flex justify-between">
                <span class="text-zinc-500">Nuxt Version</span>
                <span class="text-zinc-300">{{ client?.host?.nuxt?.versions?.nuxt }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-zinc-500">Auth Forwarding</span>
                <NBadge :n="client?.host?.nuxt?.options?.odata?.forwardAuthHeader ? 'green' : 'orange'">
                  {{ client?.host?.nuxt?.options?.odata?.forwardAuthHeader ? 'Enabled' : 'Disabled' }}
                </NBadge>
              </div>
            </div>
          </div>
        </div>

        <div v-if="activeTab === 'services'">
          <h2 class="text-sm font-bold mb-4">Configured SAP Services</h2>
          <div class="grid gap-3">
            <div v-for="svc in services" :key="svc.name" class="bg-zinc-900 border border-zinc-800 p-4 rounded-lg flex justify-between items-center">
              <div>
                <div class="font-bold">{{ svc.name }}</div>
                <div class="text-[10px] text-zinc-500 font-mono">/api/sap-odata/{{ svc.route || svc.name.toLowerCase() }}</div>
              </div>
              <div class="text-right">
                <div class="text-[10px] text-zinc-500 mb-1 tracking-tighter uppercase font-bold">Metadata Source</div>
                <div class="text-[11px] font-mono text-zinc-400 bg-black px-2 py-1 rounded">{{ svc.edmx }}</div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="activeTab === 'logs'">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-sm font-bold">Traffic Monitor</h2>
            <button @click="logs = []" class="text-[10px] text-zinc-500 hover:text-zinc-300">Clear Logs</button>
          </div>
          <div class="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
            <table class="w-full text-[11px] text-left">
              <thead class="bg-zinc-800 text-zinc-500 uppercase text-[9px] font-bold tracking-widest border-b border-zinc-800">
                <tr>
                  <th class="px-4 py-2">Status</th>
                  <th class="px-4 py-2">Method</th>
                  <th class="px-4 py-2">Entity Set</th>
                  <th class="px-4 py-2 text-right">Duration</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-zinc-800 font-mono">
                <tr v-for="log in logs" :key="log.id" class="hover:bg-zinc-800/30 transition-colors">
                  <td class="px-4 py-2">
                    <span :class="log.status < 400 ? 'text-green-400' : 'text-red-400'">{{ log.status }}</span>
                  </td>
                  <td class="px-4 py-2 text-zinc-500">{{ log.method }}</td>
                  <td class="px-4 py-2">
                    <span class="text-zinc-300">{{ log.service }}</span>
                    <span class="text-zinc-600">/</span>
                    <span class="text-blue-400">{{ log.entitySet || '-' }}</span>
                  </td>
                  <td class="px-4 py-2 text-right text-zinc-500">{{ log.duration }}ms</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>
