<script setup lang="ts">
import { onMounted } from 'vue'
import { useSharedODataState } from './composables/useODataState'

const { activeTab, fetchConfig, refreshLogs } = useSharedODataState()

const items = [
  { label: 'Overview', icon: 'i-lucide-house', id: 'overview' },
  { label: 'Services', icon: 'i-lucide-database', id: 'services' },
  { label: 'Logs', icon: 'i-lucide-terminal', id: 'logs' },
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
    <div class="h-screen flex overflow-hidden font-sans bg-neutral-50 dark:bg-neutral-950">
      <!-- Sidebar -->
      <aside class="w-16 border-r border-neutral-200/70 dark:border-neutral-800/70 flex flex-col items-center p-3 gap-4 bg-white dark:bg-neutral-900/50 shrink-0">
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
            :ui="{ rounded: 'rounded-xl' }"
            @click="activeTab = item.id as any"
          />
        </UTooltip>
      </aside>

      <!-- Main Container -->
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <!-- Header -->
        <header class="h-14 border-b border-neutral-200/70 dark:border-neutral-800/70 flex items-center justify-between px-6 shrink-0 bg-white/80 dark:bg-neutral-900/40 backdrop-blur-md">
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
          <div class="h-full flex flex-col overflow-hidden">
            <TabsTabOverview v-show="activeTab === 'overview'" class="overflow-y-auto custom-scrollbar" />
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
  background: var(--ui-neutral-200);
  border-radius: 10px;
}

.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background: var(--ui-neutral-800);
}
</style>
