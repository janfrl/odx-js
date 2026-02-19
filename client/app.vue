<script setup lang="ts">
import { onMounted, watchEffect } from 'vue'
import { useDevtoolsClient } from '@nuxt/devtools-kit/iframe-client'
import { useSharedODataState } from './composables/useODataState'

const devtoolsClient = useDevtoolsClient()
const { activeTab, fetchConfig, refreshLogs } = useSharedODataState()

watchEffect(() => {
  const mode = devtoolsClient.value?.devtools?.colorMode?.value
  if (mode && typeof document !== 'undefined') {
    const isDark = mode === 'dark'
    document.documentElement.classList.toggle('dark', isDark)
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light'
  }
})

onMounted(() => {
  fetchConfig()
  refreshLogs()
  const interval = setInterval(refreshLogs, 3000)
  return () => clearInterval(interval)
})
</script>

<template>
  <div class="h-screen flex bg-base text-base overflow-hidden font-sans border-t border-base">
    <!-- Sidebar -->
    <DevToolsSidebar class="w-14 border-r border-base bg-zinc-50/50 dark:bg-zinc-900/20 shrink-0" />

    <!-- Main Content -->
    <div class="flex-1 flex flex-col min-w-0 overflow-hidden relative">
      <DevToolsHeader />

      <main class="flex-1 overflow-hidden relative">
        <div class="h-full flex flex-col overflow-y-auto custom-scrollbar">
          <TabsTabOverview v-if="activeTab === 'overview'" />
          <TabsTabServices v-if="activeTab === 'services'" />
          <TabsTabLogs v-if="activeTab === 'logs'" />
        </div>
      </main>
    </div>
  </div>
</template>

<style>
html, body, #__nuxt {
  margin: 0 !important;
  padding: 0 !important;
  height: 100% !important;
  width: 100% !important;
  overflow: hidden !important;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(128, 128, 128, 0.2);
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(128, 128, 128, 0.4);
}
</style>
