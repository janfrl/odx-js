<script setup lang="ts">
import { useSharedODataState } from '../../composables/useODataState'

const { services, selectedService, config, generateService, generatingStatus, selectedEntity } = useSharedODataState()

const COLORS = {
  green: '#00dc82',
  orange: '#f97316'
}
</script>

<template>
  <div class="h-full flex flex-col bg-base text-base font-sans">
    <div v-if="!selectedService" class="p-8 space-y-8 overflow-y-auto custom-scrollbar">
      <div class="flex items-center justify-between px-2 text-base">
        <h2 class="text-sm font-bold opacity-70 uppercase tracking-wider text-base-content">Available Services</h2>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="svc in services"
          :key="svc.name"
          class="p-6 border rounded-2xl transition-all duration-200 cursor-pointer group bg-zinc-50/50 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 relative"
          @click="selectedService = svc"
        >
          <div class="flex items-start gap-4">
            <div class="p-3 rounded-xl bg-white dark:bg-zinc-800 border border-base transition-all shadow-sm text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2 mb-1">
                <span class="font-bold truncate text-base text-zinc-900 dark:text-zinc-100 leading-tight">{{ svc.name }}</span>
                <span
                  class="w-2 h-2 rounded-full shrink-0"
                  :style="{ backgroundColor: svc.isGenerated ? COLORS.green : COLORS.orange }"
                  :class="svc.isGenerated ? 'shadow-[0_0_8px_rgba(0,220,130,0.3)]' : 'shadow-[0_0_8px_rgba(249,115,22,0.3)]'"
                />
              </div>
              <div class="text-[11px] font-mono truncate text-zinc-500 dark:text-zinc-400 opacity-80 group-hover:opacity-100 transition-opacity">
                {{ config.basePath }}/{{ svc.route || svc.name.toLowerCase() }}
              </div>
            </div>
            <div class="opacity-0 group-hover:opacity-30 transition-opacity text-zinc-400">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" /></svg>
            </div>
          </div>
          <div class="mt-6 pt-4 border-t border-base flex justify-between items-center text-[10px] uppercase font-bold tracking-widest relative z-10">
            <span class="opacity-40 group-hover:opacity-60 transition-opacity">SDK Generation</span>
            <span :style="{ color: svc.isGenerated ? COLORS.green : COLORS.orange }" class="opacity-60 group-hover:opacity-80 transition-opacity">
              {{ svc.isGenerated ? 'Completed' : 'Pending' }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="h-full flex flex-col pt-4 overflow-hidden">
      <div class="px-6 flex items-center gap-4 mb-6 shrink-0 font-sans">
        <button
          class="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all border border-transparent bg-transparent cursor-pointer"
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
        <!-- Unified Subtle Gray Style -->
        <button
          :disabled="generatingStatus[selectedService.name]"
          class="text-[10px] uppercase tracking-[0.15em] font-bold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors bg-transparent border-none cursor-pointer pb-0.5 border-b border-dashed border-zinc-200 dark:border-zinc-800 disabled:opacity-30 flex items-center gap-2"
          @click="generateService(selectedService.name)"
        >
          <svg v-if="generatingStatus[selectedService.name]" class="animate-spin h-3 w-3" viewBox="0 0 24 24"><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
          {{ generatingStatus[selectedService.name] ? 'Generating...' : 'Regenerate SDK' }}
        </button>
      </div>
      <EntityExplorer />
    </div>
  </div>
</template>
