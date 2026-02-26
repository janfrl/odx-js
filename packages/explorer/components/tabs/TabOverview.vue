<script setup lang="ts">
import { computed } from 'vue'
import { useSharedODataState } from '../../composables/useODataState'

const { config, services } = useSharedODataState()

const stats = computed(() => [
  { label: 'Status', value: 'Active', color: 'success', icon: 'i-heroicons-check-circle' },
  { label: 'Mode', value: config.value.mode, color: 'primary', icon: 'i-heroicons-cpu-chip' },
  { label: 'Base Path', value: config.value.basePath, color: 'neutral', icon: 'i-heroicons-link' },
  { label: 'Services', value: services.value.length.toString(), color: 'neutral', icon: 'i-heroicons-server' },
])
</script>

<template>
  <UContainer class="p-8 space-y-12">
    <!-- Hero Section -->
    <div class="flex items-center gap-6">
      <div class="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
        <UIcon
          name="i-heroicons-cube"
          class="w-10 h-10 text-primary"
        />
      </div>
      <div>
        <h1 class="text-3xl font-bold tracking-tight">
          SAP OData Integration
        </h1>
        <p class="text-neutral-500 dark:text-neutral-400">
          Middleware configuration and service health overview.
        </p>
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
      <UCard
        v-for="stat in stats"
        :key="stat.label"
        variant="subtle"
      >
        <div class="flex flex-col gap-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold uppercase tracking-wider text-neutral-500">{{ stat.label }}</span>
            <UIcon
              :name="stat.icon"
              class="w-4 h-4 text-neutral-400"
            />
          </div>
          <div
            :class="`text-lg font-bold text-${stat.color}-500`"
          >
            {{ stat.value }}
          </div>
        </div>
      </UCard>
    </div>

    <!-- Configuration Details -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-12">
      <section class="space-y-6">
        <h3 class="text-sm font-bold uppercase tracking-widest text-neutral-400">
          Module Configuration
        </h3>
        <UCard>
          <ul class="divide-y divide-gray-200 dark:divide-gray-800">
            <li class="py-4 flex justify-between items-center">
              <span class="text-sm font-medium">Authentication Forwarding</span>
              <UBadge
                :color="config.forwardAuthHeader ? 'success' : 'warning'"
                variant="subtle"
              >
                {{ config.forwardAuthHeader ? 'Enabled' : 'Disabled' }}
              </UBadge>
            </li>
            <li class="py-4 flex justify-between items-center">
              <span class="text-sm font-medium">Build Directory</span>
              <UKbd size="sm">.nuxt/sap-odata/generated</UKbd>
            </li>
          </ul>
        </UCard>
      </section>

      <section class="space-y-6">
        <h3 class="text-sm font-bold uppercase tracking-widest text-neutral-400">
          System Environment
        </h3>
        <UCard>
          <ul class="divide-y divide-gray-200 dark:divide-gray-800">
            <li class="py-4 flex justify-between items-center">
              <span class="text-sm font-medium">Module Version</span>
              <span class="text-xs font-mono opacity-60">v1.0.0</span>
            </li>
            <li class="py-4 flex justify-between items-center">
              <span class="text-sm font-medium">Node.js Runtime</span>
              <span class="text-xs font-mono opacity-60">{{ config.versions?.node || 'unknown' }}</span>
            </li>
          </ul>
        </UCard>
      </section>
    </div>
  </UContainer>
</template>
