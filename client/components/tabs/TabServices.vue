<script setup lang="ts">
import { useSharedODataState } from '../../composables/useODataState'

const { services, selectedService, config, generateService, generatingStatus, selectedEntity } = useSharedODataState()
</script>

<template>
  <div class="flex-1 flex flex-col min-h-0 bg-base">
    <!-- Service List View -->
    <div v-if="!selectedService" class="p-8 space-y-8 overflow-auto">
      <h1 class="text-base font-medium opacity-80 text-zinc-900 dark:text-zinc-100">Available Services</h1>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div 
          v-for="svc in services" 
          :key="svc.name" 
          class="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 hover:border-[#00dc82]/40 group cursor-pointer shadow-sm relative border-dashed"
          @click="selectedService = svc"
        >
          <div class="flex items-start gap-4 mb-4">
            <div class="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 text-zinc-400 group-hover:text-[#00dc82]">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-2 mb-0.5">
                <h2 class="font-bold text-zinc-900 dark:text-zinc-100 truncate leading-none">{{ svc.name }}</h2>
                <span class="w-1.5 h-1.5 rounded-full shrink-0" :class="svc.isGenerated ? 'bg-[#00dc82] shadow-[0_0_8px_rgba(0,220,130,0.4)]' : 'bg-amber-500 opacity-40'" />
              </div>
              <div class="text-[10px] text-zinc-400 font-mono truncate opacity-60">{{ config.basePath }}/{{ svc.route || svc.name.toLowerCase() }}</div>
            </div>
          </div>
          <div class="flex items-center justify-between text-[9px] uppercase tracking-widest font-bold opacity-20 mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800/50">
            <span>SDK Status</span>
            <span>{{ svc.isGenerated ? 'Generated' : 'Missing' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Service Detail View (Entity Explorer) -->
    <div v-else class="flex-1 flex flex-col min-h-0 overflow-hidden pt-8 px-8">
      <header class="flex items-center gap-4 mb-8">
        <button 
          class="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors border-0 bg-transparent cursor-pointer"
          @click="selectedService = null; selectedEntity = null"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div class="min-w-0 flex-1">
          <h2 class="text-base font-bold text-zinc-900 dark:text-zinc-100 truncate mb-0.5 leading-none">{{ selectedService.name }}</h2>
          <div class="text-[10px] text-zinc-400 font-mono opacity-60">{{ config.basePath }}/{{ selectedService.route || selectedService.name.toLowerCase() }}</div>
        </div>
        <button 
          :disabled="generatingStatus[selectedService.name]"
          class="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 text-[10px] font-bold uppercase tracking-widest border border-zinc-200 dark:border-zinc-800 transition-all disabled:opacity-50 bg-transparent cursor-pointer"
          @click="generateService(selectedService.name)"
        >
          <span>Sync SDK</span>
        </button>
      </header>
      
      <EntityExplorer />
    </div>
  </div>
</template>
