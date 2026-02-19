<script setup lang="ts">
import { useSharedODataState } from '../../composables/useODataState'

const { config, services } = useSharedODataState()

const cards = computed(() => [
  { l: 'Status', v: 'Active', c: 'text-green-500', i: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
  { l: 'Mode', v: config.value.mode, c: 'text-[#00dc82] uppercase', i: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4' },
  { l: 'Base Path', v: config.value.basePath, c: 'text-zinc-500', i: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1' },
  { l: 'Services', v: services.value.length, c: 'text-zinc-500', i: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' }
])
</script>

<template>
  <div class="flex-1 overflow-auto flex flex-col min-h-0">
    <div class="p-10 space-y-10 shrink-0">
      <div class="flex items-center gap-5">
        <svg viewBox="0 0 24 24" class="w-10 h-10 fill-[#00dc82] opacity-90"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
        <div>
          <h1 class="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight leading-none mb-1.5">SAP OData</h1>
          <p class="text-zinc-400 dark:text-zinc-500 text-xs font-medium">Nuxt SAP Cloud SDK Integration</p>
        </div>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div v-for="card in cards" :key="card.l" class="bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/60 p-6 rounded-2xl border-dashed">
          <div class="flex items-center justify-between opacity-30 mb-4 text-[9px] uppercase font-bold tracking-widest">
            <span>{{ card.l }}</span>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" :d="card.i" /></svg>
          </div>
          <div :class="card.c" class="text-sm font-mono font-medium">{{ card.v }}</div>
        </div>
      </div>
    </div>
    <div class="flex-1 grid grid-cols-1 md:grid-cols-2 gap-px bg-zinc-200 dark:bg-zinc-800 border-t border-zinc-200 dark:border-zinc-800">
      <div class="bg-zinc-50 dark:bg-[#0a0a0a] p-10 space-y-6">
        <h3 class="text-[10px] font-bold uppercase tracking-[0.2em] opacity-30">Configuration</h3>
        <div class="space-y-4 max-w-md">
          <div class="flex justify-between items-center text-sm border-b border-zinc-100 dark:border-zinc-800 pb-4">
            <span class="opacity-50">Auth Forwarding</span>
            <span :class="config.forwardAuthHeader ? 'text-green-500' : 'text-orange-500'" class="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
              {{ config.forwardAuthHeader ? 'Enabled' : 'Disabled' }}
            </span>
          </div>
          <div class="flex justify-between items-center text-sm pt-2">
            <span class="opacity-50">Build Path</span>
            <span class="font-mono text-[10px] opacity-40">.nuxt/sap-odata/generated</span>
          </div>
        </div>
      </div>
      <div class="bg-zinc-50 dark:bg-[#0a0a0a] p-10 space-y-6">
        <h3 class="text-[10px] font-bold uppercase tracking-[0.2em] opacity-30">Environment</h3>
        <div class="space-y-4 max-w-md">
          <div class="flex justify-between items-center text-sm border-b border-zinc-100 dark:border-zinc-800 pb-4">
            <span class="opacity-50">Module Version</span>
            <span class="font-mono text-xs text-[#00dc82]">v1.0.0</span>
          </div>
          <div class="flex justify-between items-center text-sm pt-2">
            <span class="opacity-50">Node.js Runtime</span>
            <span class="font-mono text-xs opacity-60">{{ config.versions?.node || '...' }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
