<script setup lang="ts">
import { onMounted } from 'vue'
import { useSharedODataState } from './composables/useODataState'

const { activeTab, fetchConfig, refreshLogs } = useSharedODataState()

const navigation = [
  { id: 'overview', label: 'Overview', icon: 'i-heroicons-home' },
  { id: 'services', label: 'Services', icon: 'i-heroicons-circle-stack' },
  { id: 'logs', label: 'Logs', icon: 'i-heroicons-command-line' },
]

onMounted(() => {
  fetchConfig()
  refreshLogs()

  const interval = setInterval(refreshLogs, 3000)
  return () => clearInterval(interval)
})
</script>

<template>
  <UApp>
    <div class="h-screen flex bg-white dark:bg-[#050505] text-gray-900 dark:text-gray-300 overflow-hidden font-sans">
      <!-- Sidebar -->
      <aside class="w-16 border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#0a0a0a] shrink-0 flex flex-col items-center py-4 gap-4">
        <UButton
          v-for="item in navigation"
          :key="item.id"
          :icon="item.icon"
          :color="activeTab === item.id ? 'primary' : 'neutral'"
          variant="ghost"
          class="w-10 h-10 flex items-center justify-center"
          @click="activeTab = item.id as any"
        />
      </aside>

      <!-- Main Content -->
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <!-- Header -->
        <header class="h-14 border-b border-gray-200 dark:border-gray-800 flex items-center px-6 shrink-0 bg-white dark:bg-[#0a0a0a]">
          <h1 class="text-lg font-semibold tracking-tight">
            ODX API Explorer
          </h1>
        </header>

        <main class="flex-1 overflow-hidden relative bg-white dark:bg-[#050505]">
          <div class="h-full flex flex-col overflow-y-auto custom-scrollbar">
            <TabsTabOverview v-show="activeTab === 'overview'" />
            <TabsTabServices v-show="activeTab === 'services'" />
            <TabsTabLogs v-show="activeTab === 'logs'" />
          </div>
        </main>
      </div>
    </div>
  </UApp>
</template>

<style>
html, body, #__nuxt {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
  overflow: hidden;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #d4d4d8;
  border-radius: 10px;
}

.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background: #27272a;
}
</style>
