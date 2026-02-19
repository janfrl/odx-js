<script setup lang="ts">
import { useSharedODataState } from '../composables/useODataState'

const { selectedService } = useSharedODataState()
</script>

<template>
  <header class="h-12 border-b border-base flex items-center px-4 bg-zinc-50/50 dark:bg-zinc-900/20 justify-between shrink-0">
    <div class="flex items-center gap-3">
      <svg viewBox="0 0 24 24" class="w-6 h-6 fill-[#00dc82] opacity-90">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
      </svg>
      <span class="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-500">
        SAP OData <span class="font-normal opacity-40">Explorer</span>
      </span>
    </div>
    <div v-if="selectedService" class="flex items-center gap-2">
      <NBadge n="primary" variant="outline" class="font-mono text-[9px] uppercase tracking-widest px-2 py-0.5">
        {{ selectedService.name }}
      </NBadge>
    </div>
  </header>
</template>
