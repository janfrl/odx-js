<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useSharedODataState } from './composables/useODataState'

const { activeTab, fetchConfig, refreshLogs, logs } = useSharedODataState()

const items = computed(() => [
  { label: 'Overview', icon: 'i-lucide-house', id: 'overview' },
  { label: 'Services', icon: 'i-lucide-database', id: 'services' },
  { label: 'Logs', icon: 'i-lucide-activity', id: 'logs', badge: logs.value.length || undefined },
  { label: 'Proxy', icon: 'i-lucide-cable', id: 'proxy' },
])

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
      <aside class="w-16 border-r border-default flex flex-col items-center p-3 gap-4 bg-default/50 shrink-0">
        <UTooltip
          v-for="item in items"
          :key="item.id"
          :text="item.label"
          placement="right"
        >
          <UChip
            :text="item.badge"
            :show="!!item.badge"
            size="3xl"
            :inset="true"
            :ui="{ base: 'ring-2 ring-primary' }"
          >
            <UButton
              :icon="item.icon"
              :aria-label="item.label"
              :color="activeTab === item.id ? 'primary' : 'neutral'"
              :variant="activeTab === item.id ? 'soft' : 'ghost'"
              size="xl"
              :ui="{ base: 'rounded-xl' }"
              @click="activeTab = item.id as any"
            />
          </UChip>
        </UTooltip>
      </aside>

      <!-- Main Container -->
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <!-- Header -->
        <header class="h-14 border-b border-default flex items-center justify-between px-6 shrink-0 bg-default/50 backdrop-blur-md">
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-cable" class="w-5 h-5 text-primary" />
            <h1 class="text-sm font-bold uppercase tracking-widest text-default">
              ODX Explorer
            </h1>
          </div>

          <div class="flex items-center gap-4">
            <UColorModeButton />
          </div>
        </header>

        <main class="flex-1 overflow-hidden relative">
          <div class="h-full flex flex-col overflow-hidden">
            <TabsTabOverview v-show="activeTab === 'overview'" />
            <TabsTabServices v-show="activeTab === 'services'" />
            <TabsTabLogs v-show="activeTab === 'logs'" />
            <TabsTabProxy v-show="activeTab === 'proxy'" />
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

.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: var(--ui-color-neutral-200) transparent;
}

.dark .custom-scrollbar {
  scrollbar-color: var(--ui-color-neutral-800) transparent;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: var(--ui-color-neutral-200);
  border-radius: 10px;
}

.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background: var(--ui-color-neutral-800);
}
</style>
