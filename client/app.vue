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
  
  // Prime the standard notification position to avoid the initial "top-center" jump
  devtoolsUiShowNotification({ message: '', duration: 0, position: 'bottom-right' })

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
          <TabsTabOverview v-show="activeTab === 'overview'" />
          <TabsTabServices v-show="activeTab === 'services'" />
          <TabsTabLogs v-show="activeTab === 'logs'" />
        </div>
      </main>
    </div>

    <NNotification position="bottom-right" />
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

/* Force standard notification to bottom-right if it ignores the prop */
.fixed.left-0.right-0.top-0.z-999, 
.fixed.left-0.right-0.bottom-0.z-999 {
  top: auto !important;
  bottom: 0 !important;
  display: flex !important;
  justify-content: flex-end !important;
  padding: 1.5rem !important;
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
