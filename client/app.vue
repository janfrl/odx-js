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
  <div class="h-screen flex bg-base text-base overflow-hidden font-sans border-t border-base text-base">
    <!-- Sidebar -->
    <DevToolsSidebar class="w-14 border-r border-base bg-zinc-50/50 dark:bg-zinc-900/20 shrink-0" />

    <!-- Main Content -->
    <div class="flex-1 flex flex-col min-w-0 overflow-hidden relative">
      <DevToolsHeader />

      <main class="flex-1 overflow-hidden relative">
        <div class="h-full flex flex-col overflow-y-auto custom-scrollbar bg-base">
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

/* Custom Scrollbar styled to match the UI headers (Flat) */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #f4f4f5; /* zinc-100 */
  border-radius: 0;
}

.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background: #18181b; /* zinc-900 */
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #e4e4e7;
}

.dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #27272a;
}

.slide-enter-active, .slide-leave-active { transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
.slide-enter-from, .slide-leave-to { transform: translateX(100%); }
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
