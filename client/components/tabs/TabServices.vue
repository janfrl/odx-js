<script setup lang="ts">
import { useSharedODataState } from '../../composables/useODataState'

const { services, selectedService, config, generateService, generatingStatus, selectedEntity } = useSharedODataState()
</script>

<template>
  <div class="h-full flex flex-col bg-base text-base">
    <!-- Service List View -->
    <div v-if="!selectedService" class="p-8 space-y-8 overflow-y-auto custom-scrollbar">
      <div class="flex items-center justify-between">
        <h2 class="text-sm font-semibold opacity-70 uppercase tracking-wider">Available Services</h2>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <NCard
          v-for="svc in services"
          :key="svc.name"
          class="p-6 border-dashed hover:border-primary/50 transition-all cursor-pointer group bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm"
          @click="selectedService = svc"
        >
          <div class="flex items-start gap-4">
            <div class="p-3 rounded-xl bg-white dark:bg-zinc-800 border border-base group-hover:text-primary transition-colors shadow-sm">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2 mb-1">
                <span class="font-bold truncate text-base text-zinc-900 dark:text-zinc-100">{{ svc.name }}</span>
                <span
                  class="w-2 h-2 rounded-full"
                  :class="svc.isGenerated ? 'bg-primary shadow-[0_0_8px_rgba(0,220,130,0.4)]' : 'bg-amber-500 opacity-40'"
                />
              </div>
              <div class="text-[11px] font-mono opacity-60 truncate text-zinc-500">
                {{ config.basePath }}/{{ svc.route || svc.name.toLowerCase() }}
              </div>
            </div>
          </div>
          <div class="mt-6 pt-4 border-t border-base flex justify-between items-center opacity-40 text-[10px] uppercase font-bold tracking-widest">
            <span>SDK Generation</span>
            <span :class="svc.isGenerated ? 'text-primary' : 'text-amber-500'">{{ svc.isGenerated ? 'Completed' : 'Pending' }}</span>
          </div>
        </NCard>
      </div>
    </div>

    <!-- Detail View (Full height, no bottom gap) -->
    <div v-else class="flex-1 flex flex-col pt-4 overflow-hidden">
      <div class="px-6 flex items-center gap-4 mb-6 shrink-0 font-sans">
        <button
          class="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all border border-transparent bg-transparent cursor-pointer"
          title="Back to services"
          @click="selectedService = null; selectedEntity = null"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div class="min-w-0 flex-1">
          <h2 class="text-lg font-bold leading-none mb-1 text-zinc-900 dark:text-zinc-100">{{ selectedService.name }}</h2>
          <div class="text-[11px] font-mono text-zinc-400 opacity-90 tracking-tight">
            {{ config.basePath }}/{{ selectedService.route || selectedService.name.toLowerCase() }}
          </div>
        </div>
        <NButton
          n="primary"
          variant="outline"
          class="text-[10px] uppercase font-bold px-4 py-2"
          :loading="generatingStatus[selectedService.name]"
          @click="generateService(selectedService.name)"
        >
          Sync SDK
        </NButton>
      </div>

      <!-- Fills the rest of the height -->
      <EntityExplorer class="flex-1" />
    </div>
  </div>
</template>
