<script setup lang="ts">
import { useSharedODataState } from '../composables/useODataState'

const { activeTab, logs } = useSharedODataState()

const tabs = [
  { id: 'overview', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { id: 'services', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
  { id: 'logs', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' }
]
</script>

<template>
  <aside class="w-14 border-r border-zinc-200 dark:border-zinc-800 flex flex-col items-center py-4 gap-2 bg-zinc-50 dark:bg-zinc-900/20 shrink-0">
    <button
      v-for="tab in tabs"
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
      >
        <path stroke-linecap="round" stroke-linejoin="round" :d="tab.icon" />
      </svg>
      <span
        v-if="tab.id === 'logs' && logs.length"
        class="absolute top-1 right-1 bg-[#00dc82] text-white dark:text-[#050505] text-[8px] px-1.5 py-0.5 rounded-full font-bold shadow-sm border border-[#00dc82]/20"
      >
        {{ logs.length }}
      </span>
    </button>
  </aside>
</template>
