<script setup lang="ts">
import { useSharedODataState } from '../composables/useODataState'

const { selectedService, activeTab } = useSharedODataState()
</script>

<template>
  <header class="h-12 border-b border-base flex items-center px-4 bg-white dark:bg-[#0a0a0a] justify-between shrink-0">
    <div class="flex items-center gap-3">
      <svg
        viewBox="0 0 24 24"
        class="w-6 h-6 fill-primary opacity-90"
      >
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
      </svg>
      <span class="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-500 dark:text-zinc-400">
        SAP OData <span class="font-medium text-zinc-500 dark:text-zinc-400 opacity-70">Explorer</span>
      </span>
    </div>

    <!-- Context Indicator -->
    <div
      v-if="activeTab === 'services' && selectedService"
      class="flex items-center gap-2 animate-fade-in"
    >
      <NBadge
        n="primary"
        variant="outline"
        class="font-mono text-[10px] tracking-widest px-2 py-0.5"
      >
        {{ selectedService.name }}
      </NBadge>
    </div>
  </header>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.2s ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateX(4px); }
  to { opacity: 1; transform: translateX(0); }
}
</style>
