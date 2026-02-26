<script setup lang="ts">
import { onMounted } from 'vue'
import { useSharedODataState } from './composables/useODataState'

const { activeTab, fetchConfig, refreshLogs } = useSharedODataState()

const items = [
  { label: 'Overview', icon: 'i-heroicons-home', id: 'overview' },
  { label: 'Services', icon: 'i-heroicons-circle-stack', id: 'services' },
  { label: 'Logs', icon: 'i-heroicons-command-line', id: 'logs' },
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
    <div class="h-screen flex overflow-hidden font-sans bg-white dark:bg-black">
      <!-- Sidebar -->
      <aside class="w-16 border-r border-gray-200 dark:border-gray-800 flex flex-col items-center py-4 gap-4 bg-gray-50 dark:bg-zinc-900/50 shrink-0">
        <UTooltip
          v-for="item in items"
          :key="item.id"
          :text="item.label"
          placement="right"
        >
          <UButton
            :icon="item.icon"
            :color="activeTab === item.id ? 'primary' : 'neutral'"
            :variant="activeTab === item.id ? 'soft' : 'ghost'"
            size="xl"
            @click="activeTab = item.id as any"
          />
        </UTooltip>
      </aside>

      <!-- Main Container -->
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <!-- Header -->
        <header class="h-14 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6 shrink-0 bg-white dark:bg-zinc-900/20">
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-cube-transparent" class="w-5 h-5 text-primary" />
            <h1 class="text-sm font-bold uppercase tracking-widest text-neutral-900 dark:text-neutral-100">
              ODX Explorer
            </h1>
          </div>

          <div class="flex items-center gap-4">
            <UColorModeButton />
          </div>
        </header>

        <main class="flex-1 overflow-hidden relative">
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
  background: var(--ui-gray-200);
  border-radius: 10px;
}

.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background: var(--ui-gray-800);
}
</style>
