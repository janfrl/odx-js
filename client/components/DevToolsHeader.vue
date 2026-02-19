<script setup lang="ts">
import { useSharedODataState } from '../composables/useODataState'

const { selectedService } = useSharedODataState()
</script>

<template>
  <header class="h-12 border-b border-zinc-200 dark:border-zinc-800 flex items-center px-6 bg-zinc-50/50 dark:bg-[#0a0a0a] shrink-0 justify-between">
    <div class="flex items-center gap-3 text-zinc-500 dark:text-zinc-400">
      <div class="text-[#00dc82]/80">
        <svg viewBox="0 0 24 24" class="w-5 h-5 fill-current opacity-80"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
      </div>
      <span class="font-bold text-[10px] tracking-[0.2em] uppercase">SAP OData <span class="font-normal opacity-40 text-[9px]">Explorer</span></span>
    </div>
    <div v-if="selectedService" class="text-[10px] font-mono text-[#00dc82]/60 uppercase tracking-widest">
      {{ selectedService.name }}
    </div>
  </header>
</template>
