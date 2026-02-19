<script setup lang="ts">
import { useSharedODataState } from '../composables/useODataState'

const { activeTab, logs } = useSharedODataState()

const tabs = [
  { 
    id: 'overview', 
    title: 'Overview', 
    icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' 
  },
  { 
    id: 'services', 
    title: 'Services', 
    icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' 
  },
  { 
    id: 'logs', 
    title: 'Logs', 
    icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' 
  }
] as const
</script>

<template>
  <div class="flex flex-col items-center py-4 gap-2 h-full bg-zinc-50/50 dark:bg-zinc-900/40">
    <!-- Navigation -->
    <div class="flex flex-col gap-2 w-full items-center">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="w-10 h-10 flex items-center justify-center rounded-xl transition-all relative border-none cursor-pointer group"
        :title="tab.title"
        :class="activeTab === tab.id ? 'text-primary bg-primary/10 shadow-sm' : 'text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800'"
        @click="activeTab = tab.id"
      >
        <svg
          class="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          stroke-width="1.5"
        >
          <path stroke-linecap="round" stroke-linejoin="round" :d="tab.icon" />
        </svg>
        
        <NBadge
          v-if="tab.id === 'logs' && logs.length"
          n="primary"
          class="absolute -top-1 -right-1 scale-[0.6] font-bold"
        >
          {{ logs.length }}
        </NBadge>

        <!-- Tooltip -->
        <div class="absolute left-full ml-2 px-2 py-1 bg-zinc-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
          {{ tab.title }}
        </div>
      </button>
    </div>
  </div>
</template>
