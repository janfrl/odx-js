<script setup lang="ts">
import { useDevtoolsClient } from '@nuxt/devtools-kit/iframe-client'
import { onMounted, watchEffect } from 'vue'
import { useSharedODataState } from './composables/useODataState'

const devtoolsClient = useDevtoolsClient()
const { activeTab, fetchConfig, refreshLogs } = useSharedODataState()

watchEffect(() => {
  const mode = devtoolsClient.value?.devtools?.colorMode
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
    <DevToolsSidebar class="w-14 border-r border-base bg-surface shrink-0" />

    <!-- Main Content -->
    <div class="flex-1 flex flex-col min-w-0 overflow-hidden relative">
      <DevToolsHeader class="bg-surface" />

      <main class="flex-1 overflow-hidden relative">
        <div class="h-full flex flex-col overflow-y-auto custom-scrollbar bg-base">
          <TabsTabOverview v-if="activeTab === 'overview'" />
          <TabsTabServices v-if="activeTab === 'services'" />
          <TabsTabSchema v-if="activeTab === 'schema'" />
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

.slide-enter-active, .slide-leave-active { transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
.slide-enter-from, .slide-leave-to { transform: translateX(100%); }
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
