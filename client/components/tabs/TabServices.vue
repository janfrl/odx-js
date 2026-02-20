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
      <div class="flex items-center justify-between px-2">
        <h2 class="text-sm font-bold opacity-70 uppercase tracking-wider">Available Services</h2>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="svc in services"
          :key="svc.name"
          class="p-6 border rounded-2xl transition-all duration-200 cursor-pointer group bg-surface border-base hover:border-primary/30 hover:bg-primary/5 relative"
          @click="selectedService = svc"
        >
          <div class="flex items-start gap-4">
            <div class="p-3 rounded-xl bg-content border border-base transition-all shadow-sm text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200">
              <NIcon name="i-carbon-cloud-service-management" class="text-2xl" />
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2 mb-1">
                <span class="font-bold truncate text-base leading-tight">{{ svc.name }}</span>
                <span
                  class="w-2 h-2 rounded-full shrink-0"
                  :style="{ backgroundColor: svc.isGenerated ? COLORS.green : COLORS.orange }"
                  :class="svc.isGenerated ? 'shadow-[0_0_8px_rgba(0,220,130,0.3)]' : 'shadow-[0_0_8px_rgba(249,115,22,0.3)]'"
                />
              </div>
              <div class="text-[11px] font-mono text-muted opacity-80 group-hover:opacity-100 transition-opacity">
                {{ config.basePath }}/{{ svc.route || svc.name.toLowerCase() }}
              </div>
            </div>
            <div class="opacity-0 group-hover:opacity-30 transition-opacity text-zinc-400">
              <NIcon name="i-carbon-chevron-right" class="text-xl" />
            </div>
          </div>
          <div class="mt-6 pt-4 border-t border-base flex justify-between items-center text-[10px] uppercase font-bold tracking-widest relative z-10">
            <span class="opacity-40 group-hover:opacity-60 transition-opacity">SDK Generation</span>
            <span 
              :style="{ color: svc.isGenerated ? COLORS.green : COLORS.orange }" 
              class="opacity-60 group-hover:opacity-80 transition-opacity"
            >
              {{ svc.isGenerated ? 'Completed' : 'Pending' }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="h-full flex flex-col pt-4 overflow-hidden bg-base">
      <div class="px-6 flex items-center gap-4 mb-6 shrink-0 font-sans">
        <button
          class="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-surface text-muted hover:text-base transition-all border border-transparent bg-transparent cursor-pointer"
          @click="selectedService = null; selectedEntity = null"
        >
          <NIcon name="i-carbon-chevron-left" class="text-xl" />
        </button>
        <div class="min-w-0 flex-1">
          <h2 class="text-lg font-bold leading-none mb-1">{{ selectedService.name }}</h2>
          <div class="text-[11px] font-mono text-muted opacity-90 tracking-tight">
            {{ config.basePath }}/{{ selectedService.route || selectedService.name.toLowerCase() }}
          </div>
        </div>
        <button
          :disabled="generatingStatus[selectedService.name]"
          class="text-[10px] uppercase tracking-[0.15em] font-bold text-muted hover:text-base transition-colors bg-transparent border-none cursor-pointer pb-0.5 border-b border-dashed border-base disabled:opacity-30 flex items-center gap-2"
          @click="generateService(selectedService.name)"
        >
          <NIcon v-if="generatingStatus[selectedService.name]" name="i-carbon-progress-bar-round" class="animate-spin" />
          {{ generatingStatus[selectedService.name] ? 'Generating...' : 'Regenerate SDK' }}
        </button>
      </div>
      <EntityExplorer />
    </div>
  </div>
</template>
