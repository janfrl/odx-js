<script setup lang="ts">
import { computed } from 'vue'
import { useSharedODataState } from '../../composables/useODataState'

const { config, services } = useSharedODataState()

const stats = computed(() => [
  { label: 'Status', value: 'Active', color: 'text-green-500', icon: 'i-heroicons-check-circle' },
  { label: 'Mode', value: config.value.mode, color: 'text-primary uppercase', icon: 'i-heroicons-cpu-chip' },
  { label: 'Base Path', value: config.value.basePath, color: 'text-gray-600 dark:text-gray-400', icon: 'i-heroicons-link' },
  { label: 'Services', value: services.value.length.toString(), color: 'text-gray-600 dark:text-gray-400', icon: 'i-heroicons-server' },
])
</script>

<template>
  <div class="p-8 space-y-10">
    <div class="flex items-center gap-5">
      <UIcon
        name="i-heroicons-cube"
        class="w-10 h-10 text-primary"
      />
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-gray-900 dark:text-white leading-none mb-1.5 font-sans">
          SAP OData Integration
        </h1>
        <p class="text-gray-500 dark:text-gray-400 text-xs font-medium">
          Manage and test your SAP Cloud SDK services.
        </p>
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
      <div
        v-for="stat in stats"
        :key="stat.label"
        class="p-6 border border-dashed rounded-xl relative bg-white dark:bg-[#0a0a0a] border-gray-200 dark:border-gray-800 shadow-sm dark:shadow-none"
      >
        <div class="flex items-center justify-between opacity-60 mb-4 text-[9px] uppercase font-bold tracking-widest text-gray-600 dark:text-gray-400">
          <span>{{ stat.label }}</span>
          <UIcon
            :name="stat.icon"
            class="w-4 h-4"
          />
        </div>
        <div
          :class="stat.color"
          class="font-mono font-bold text-[13px]"
        >
          {{ stat.value }}
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start px-2">
      <section class="space-y-6">
        <div class="flex items-center gap-2 opacity-50 uppercase text-[10px] font-bold tracking-[0.2em]">
          <UIcon
            name="i-heroicons-cog-6-tooth"
            class="w-3.5 h-3.5"
          />
          <span>Configuration</span>
        </div>
        <div class="space-y-4">
          <div class="flex justify-between items-center text-sm border-b border-gray-200 dark:border-gray-800 pb-4">
            <span class="opacity-60 font-medium">Auth Forwarding</span>
            <UBadge
              :color="config.forwardAuthHeader ? 'success' : 'warning'"
              variant="subtle"
              class="uppercase text-[10px] font-bold tracking-widest px-2 py-1"
            >
              {{ config.forwardAuthHeader ? 'Enabled' : 'Disabled' }}
            </UBadge>
          </div>
          <div class="flex justify-between items-center text-sm pt-2">
            <span class="opacity-60 font-medium">Build Path</span>
            <span class="font-mono text-[10px] opacity-50">.nuxt/sap-odata/generated</span>
          </div>
        </div>
      </section>

      <section class="space-y-6">
        <div class="flex items-center gap-2 opacity-50 uppercase text-[10px] font-bold tracking-[0.2em]">
          <UIcon
            name="i-heroicons-computer-desktop"
            class="w-3.5 h-3.5"
          />
          <span>Environment</span>
        </div>
        <div class="space-y-4">
          <div class="flex justify-between items-center text-sm border-b border-gray-200 dark:border-gray-800 pb-4">
            <span class="opacity-60 font-medium">Module Version</span>
            <UBadge
              color="neutral"
              variant="subtle"
              class="font-mono text-[10px] font-bold px-2 py-1"
            >
              v1.0.0
            </UBadge>
          </div>
          <div class="flex justify-between items-center text-sm pt-2">
            <span class="opacity-60 font-medium">Node.js Runtime</span>
            <span class="font-mono text-xs opacity-60 dark:opacity-40">{{ config.versions?.node || 'unknown' }}</span>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
