<script setup lang="ts">
import { useSharedODataState } from '../composables/useODataState'

const { selectedService, activeTab } = useSharedODataState()

const COLORS = {
  green: '#00dc82',
  orange: '#f97316'
}
</script>

<template>
  <header class="h-12 border-b border-base flex items-center px-4 bg-zinc-50/50 dark:bg-zinc-900/20 justify-between shrink-0 font-sans">
    <div class="flex items-center gap-3">
      <svg viewBox="0 0 24 24" class="w-6 h-6 fill-primary opacity-90">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
      </svg>
      <span class="text-[10px] font-bold tracking-[0.2em] uppercase text-zinc-500">
        SAP OData <span class="font-medium text-zinc-400 dark:text-zinc-500 opacity-70">Explorer</span>
      </span>
    </div>
    
    <!-- Context Indicator with Status Color -->
    <div v-if="activeTab === 'services' && selectedService" class="flex items-center gap-2 animate-fade-in">
      <div class="w-px h-4 bg-base mx-1" />
      <NBadge 
        variant="outline" 
        class="font-mono text-[9px] uppercase tracking-widest px-2 py-0.5 transition-colors duration-500"
        :style="{ 
          color: selectedService.isGenerated ? COLORS.green : COLORS.orange,
          borderColor: selectedService.isGenerated ? `${COLORS.green}44` : `${COLORS.orange}44`,
          backgroundColor: selectedService.isGenerated ? `${COLORS.green}11` : `${COLORS.orange}11`
        }"
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
