<script setup lang="ts">
import { useSharedODataState } from '../../composables/useODataState'
import EntityExplorer from '../EntityExplorer.vue'
import SchemaExplorer from '../SchemaExplorer.vue'

const { services, selectedService, config, generateService, generatingStatus, selectedEntity, globalViewMode } = useSharedODataState()

const COLORS = {
  green: '#00dc82',
  orange: '#f97316',
}

// Icons
const ICONS = {
  service: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
  chevronRight: 'M9 5l7 7-7 7',
  chevronLeft: 'M15 19l-7-7 7-7',
}

async function runGenerate(name: string) {
  await generateService(name)
  useDevtoolsUiNotification().show({
    message: `SDK for ${name} regenerated successfully`,
    icon: 'i-carbon-checkmark-outline',
    classes: 'text-green-500 border-green-500/20 bg-green-500/5',
  })
}
</script>

<template>
  <div class="h-full flex flex-col bg-base text-base font-sans">
    <div
      v-if="!selectedService"
      class="p-8 space-y-8 overflow-y-auto custom-scrollbar"
    >
      <div class="flex items-center justify-between px-2 text-base">
        <h2 class="text-sm font-bold opacity-70 uppercase tracking-wider text-base-content">
          Available Services
        </h2>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-base">
        <div
          v-for="svc in services"
          :key="svc.name"
          class="p-6 border rounded-2xl transition-all duration-200 cursor-pointer group bg-zinc-50/50 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 relative"
          @click="selectedService = svc"
        >
          <div class="flex items-start gap-4">
            <div class="p-3 rounded-xl bg-white dark:bg-zinc-800 border border-base transition-all shadow-sm text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200">
              <svg
                class="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                stroke-width="1.5"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  :d="ICONS.service"
                />
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
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                stroke-width="2.5"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  :d="ICONS.chevronRight"
                />
              </svg>
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

    <div
      v-else
      class="h-full flex flex-col pt-8 overflow-hidden bg-base"
    >
      <!-- Service Header -->
      <div class="px-6 flex items-center gap-4 mb-6 shrink-0 font-sans text-base">
        <button
          class="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all border border-transparent bg-transparent cursor-pointer"
          title="Back to services"
          @click="selectedService = null; selectedEntity = null"
        >
          <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            stroke-width="2.5"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              :d="ICONS.chevronLeft"
            />
          </svg>
        </button>
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2 mb-1 text-base text-base">
            <h2 class="text-lg font-bold leading-none text-zinc-900 dark:text-zinc-100 text-base">
              {{ selectedService.name }}
            </h2>
            <button
              :disabled="generatingStatus[selectedService.name]"
              class="p-1 rounded-md text-muted hover:text-primary hover:bg-primary/5 transition-all cursor-pointer border-none disabled:opacity-30"
              title="Regenerate SDK from EDMX"
              @click="runGenerate(selectedService.name)"
            >
              <div 
                class="w-4 h-4 i-carbon-renew" 
                :class="{ 'animate-spin': generatingStatus[selectedService.name] }"
              />
            </button>
          </div>
          <div class="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 opacity-90 tracking-tight text-base">
            {{ config.basePath }}/{{ selectedService.route || selectedService.name.toLowerCase() }}
          </div>
        </div>

        <!-- View Toggle -->
        <div class="flex bg-zinc-500/10 p-0.5 rounded-lg border border-base items-center text-base">
          <button 
            class="px-3 py-1.5 text-[9px] uppercase font-black tracking-widest rounded-md transition-all cursor-pointer border-none text-base"
            :class="globalViewMode === 'explorer' ? 'bg-white dark:bg-zinc-800 text-primary shadow-sm' : 'bg-transparent text-muted hover:text-base'"
            @click="globalViewMode = 'explorer'"
          >
            Data
          </button>
          <button 
            class="px-3 py-1.5 text-[9px] uppercase font-black tracking-widest rounded-md transition-all cursor-pointer border-none text-base"
            :class="globalViewMode === 'schema' ? 'bg-white dark:bg-zinc-800 text-primary shadow-sm' : 'bg-transparent text-muted hover:text-base'"
            @click="globalViewMode = 'schema'"
          >
            Schema
          </button>
        </div>
      </div>

      <!-- Conditional Content -->
      <EntityExplorer v-show="globalViewMode === 'explorer'" />
      <SchemaExplorer v-show="globalViewMode === 'schema'" />
    </div>
  </div>
</template>
