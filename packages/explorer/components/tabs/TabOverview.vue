<script setup lang="ts">
import { computed } from 'vue'
import { useSharedODataState } from '../../composables/useODataState'

const { config, services } = useSharedODataState()

const stats = computed(() => [
  { label: 'Status', value: 'Active', icon: 'i-lucide-circle-check', color: 'success' as const },
  { label: 'Mode', value: config.value.mode, icon: 'i-lucide-cpu', color: 'primary' as const },
  { label: 'Base Path', value: config.value.basePath, icon: 'i-lucide-link', color: 'neutral' as const },
  { label: 'Services', value: services.value.length.toString(), icon: 'i-lucide-server', color: 'neutral' as const },
])
</script>

<template>
  <div class="p-6 lg:p-10 space-y-10 overflow-y-auto custom-scrollbar h-full bg-neutral-50/30 dark:bg-neutral-950/30">
    <!-- Stats Row -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <UCard
        v-for="stat in stats"
        :key="stat.label"
        variant="subtle"
        :color="stat.color"
      >
        <template #header>
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold uppercase tracking-wider opacity-70">{{ stat.label }}</span>
            <UIcon :name="stat.icon" class="w-4 h-4" />
          </div>
        </template>
        <p class="text-2xl font-bold tracking-tight">
          {{ stat.value }}
        </p>
      </UCard>
    </div>

    <!-- Details -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-sliders-horizontal" class="w-4 h-4 text-primary" />
            <h3 class="text-sm font-bold uppercase tracking-widest">
              Configuration
            </h3>
          </div>
        </template>

        <div class="divide-y divide-[var(--ui-border)] -mx-4 -my-5">
          <div class="px-4 py-3.5 flex justify-between items-center">
            <span class="text-sm text-[var(--ui-text-muted)]">Auth Forwarding</span>
            <UBadge :color="config.forwardAuthHeader ? 'success' : 'neutral'" variant="soft" size="sm">
              {{ config.forwardAuthHeader ? 'Enabled' : 'Disabled' }}
            </UBadge>
          </div>
          <div class="px-4 py-3.5 flex justify-between items-center">
            <span class="text-sm text-[var(--ui-text-muted)]">Build Directory</span>
            <code class="text-xs font-mono text-[var(--ui-text-highlighted)]">.nuxt/sap-odata/generated</code>
          </div>
          <div class="px-4 py-3.5 flex justify-between items-center">
            <span class="text-sm text-[var(--ui-text-muted)]">Framework</span>
            <span class="text-xs font-bold opacity-50 uppercase tracking-widest">Nitro / Nuxt 4</span>
          </div>
        </div>
      </UCard>

      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-terminal" class="w-4 h-4 text-primary" />
            <h3 class="text-sm font-bold uppercase tracking-widest">
              Runtime
            </h3>
          </div>
        </template>

        <div class="divide-y divide-[var(--ui-border)] -mx-4 -my-5">
          <div class="px-4 py-3.5 flex justify-between items-center">
            <span class="text-sm text-[var(--ui-text-muted)]">Node.js</span>
            <span class="text-sm font-medium">{{ config.versions?.node || 'unknown' }}</span>
          </div>
          <div class="px-4 py-3.5 flex justify-between items-center">
            <span class="text-sm text-[var(--ui-text-muted)]">Module</span>
            <span class="text-sm font-medium">v{{ config.versions?.module || '1.0.0' }}</span>
          </div>
          <div class="px-4 py-3.5 flex justify-between items-center">
            <span class="text-sm text-[var(--ui-text-muted)]">License</span>
            <span class="text-xs font-bold opacity-50 uppercase tracking-widest">Proprietary</span>
          </div>
        </div>
      </UCard>
    </div>

    <footer class="pt-10 flex flex-col items-center gap-4">
      <USeparator />
      <p class="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-[0.3em]">
        &copy; {{ new Date().getFullYear() }} Bechtle AG &bull; ODX Explorer
      </p>
    </footer>
  </div>
</template>
