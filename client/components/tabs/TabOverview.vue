<script setup lang="ts">
import { computed } from 'vue'
import { useSharedODataState } from '../../composables/useODataState'

const { config, services } = useSharedODataState()

const stats = computed(() => [
  { label: 'Status', value: 'Active', color: 'text-green-500', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
  { label: 'Mode', value: config.value.mode, color: 'text-primary uppercase', icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4' },
  { label: 'Base Path', value: config.value.basePath, color: 'text-zinc-500', icon: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1' },
  { label: 'Services', value: services.value.length.toString(), color: 'text-zinc-500', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' }
])
</script>

<template>
  <div class="p-8 space-y-10 bg-base">
    <!-- Header -->
    <div class="flex items-center gap-5">
      <svg viewBox="0 0 24 24" class="w-10 h-10 fill-primary opacity-90">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
      </svg>
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-base-content leading-none mb-1.5 font-sans">SAP OData Integration</h1>
        <p class="text-zinc-500 text-xs font-medium">Manage and test your SAP Cloud SDK services.</p>
      </div>
    </div>

    <!-- Stats Grid (Non-Interactive) -->
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-base">
      <div 
        v-for="stat in stats" 
        :key="stat.label" 
        class="p-6 border border-dashed rounded-xl relative bg-zinc-50/20 dark:bg-zinc-900/10 border-zinc-200 dark:border-zinc-800"
      >
        <div class="flex items-center justify-between opacity-30 mb-4 text-[9px] uppercase font-bold tracking-widest">
          <span>{{ stat.label }}</span>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" :d="stat.icon" />
          </svg>
        </div>
        <div :class="stat.color" class="font-mono font-medium text-sm">
          {{ stat.value }}
        </div>
      </div>
    </div>

    <!-- Config Sections -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start px-2">
      <!-- Configuration -->
      <section class="space-y-6">
        <div class="flex items-center gap-2 opacity-40 uppercase text-[10px] font-bold tracking-[0.2em]">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37a1.724 1.724 0 002.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          <span>Configuration</span>
        </div>
        <div class="space-y-4">
          <div class="flex justify-between items-center text-sm border-b border-base pb-4">
            <span class="opacity-50">Auth Forwarding</span>
            <NBadge :n="config.forwardAuthHeader ? 'green' : 'orange'" variant="outline" class="uppercase text-[10px] font-bold tracking-widest px-2 py-1">
              {{ config.forwardAuthHeader ? 'Enabled' : 'Disabled' }}
            </NBadge>
          </div>
          <div class="flex justify-between items-center text-sm pt-2">
            <span class="opacity-50">Build Path</span>
            <span class="font-mono text-[10px] opacity-40">.nuxt/sap-odata/generated</span>
          </div>
        </div>
      </section>

      <!-- Environment -->
      <section class="space-y-6">
        <div class="flex items-center gap-2 opacity-40 uppercase text-[10px] font-bold tracking-[0.2em]">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
          <span>Environment</span>
        </div>
        <div class="space-y-4">
          <div class="flex justify-between items-center text-sm border-b border-base pb-4">
            <span class="opacity-50">Module Version</span>
            <span class="text-primary font-mono text-xs font-bold px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded">v1.0.0</span>
          </div>
          <div class="flex justify-between items-center text-sm pt-2">
            <span class="opacity-50">Node.js Runtime</span>
            <span class="font-mono text-xs opacity-60">{{ config.versions?.node || 'unknown' }}</span>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
