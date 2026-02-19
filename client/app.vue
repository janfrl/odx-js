<script setup lang="ts">
import { onMounted, watchEffect } from 'vue'
import { useDevtoolsClient } from '@nuxt/devtools-kit/iframe-client'
import { useSharedODataState } from './composables/useODataState'

// --- DEVTOOLS INTEGRATION ---
const devtoolsClient = useDevtoolsClient()

// Sync dark mode from Nuxt DevTools
watchEffect(() => {
  const mode = devtoolsClient.value?.devtools?.colorMode?.value
  if (mode && typeof document !== 'undefined') {
    const isDark = mode === 'dark'
    document.documentElement.classList.toggle('dark', isDark)
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light'
  }
})

// --- STATE ---
const { activeTab, fetchConfig, refreshLogs } = useSharedODataState()

onMounted(() => {
  fetchConfig()
  refreshLogs()
  // Poll for logs every 3 seconds
  const interval = setInterval(refreshLogs, 3000)
  return () => clearInterval(interval)
})
</script>

<template>
  <div class="h-screen flex bg-white dark:bg-[#050505] text-zinc-700 dark:text-zinc-400 overflow-hidden font-sans select-none border-t border-zinc-200 dark:border-zinc-800">
    <DevToolsSidebar />

    <main class="flex-1 flex flex-col min-w-0 overflow-hidden relative">
      <DevToolsHeader />

      <div class="flex-1 overflow-hidden flex flex-col">
        <TabsTabOverview v-if="activeTab === 'overview'" />
        <TabsTabServices v-if="activeTab === 'services'" />
        <TabsTabLogs v-if="activeTab === 'logs'" />
      </div>
    </main>
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
button { font-family: inherit; }
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
.custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #e4e4e7; border-radius: 10px; }
.dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #18181b; }
.slide-enter-active, .slide-leave-active { transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
.slide-enter-from, .slide-leave-to { transform: translateX(100%); }
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
