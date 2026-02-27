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
  <div class="p-8 lg:p-12 space-y-12 max-w-7xl mx-auto w-full bg-transparent">
    <!-- Hero Section -->
    <div class="flex items-center gap-8">
      <div class="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center shrink-0 shadow-inner">
        <UIcon
          name="i-heroicons-cube"
          class="w-12 h-12 text-primary"
        />
      </div>
      <div>
        <h1 class="text-4xl font-black tracking-tight text-neutral-900 dark:text-neutral-100 mb-2">
          SAP OData Integration
        </h1>
        <p class="text-lg text-neutral-500 dark:text-neutral-400 font-medium">
          Middleware configuration and service health overview.
        </p>
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <UCard
        v-for="stat in stats"
        :key="stat.label"
        :ui="{ body: 'p-6' }"
        class="group hover:ring-2 hover:ring-primary-500/50 transition-all duration-300 overflow-hidden relative"
      >
        <div class="flex flex-col gap-3">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 group-hover:text-neutral-500 transition-colors">
              {{ stat.label }}
            </span>
            <UIcon
              :name="stat.icon"
              class="w-5 h-5 text-neutral-300 group-hover:text-primary transition-colors"
            />
          </div>
          <div
            class="text-2xl font-black tracking-tight"
            :class="{
              'text-success-500 dark:text-success-400': stat.color === 'success',
              'text-primary-500 dark:text-primary-400': stat.color === 'primary',
              'text-neutral-900 dark:text-neutral-100': stat.color === 'neutral',
            }"
          >
            {{ stat.value }}
          </div>
        </div>
        <!-- Subtle Background Glow -->
        <div class="absolute -right-4 -bottom-4 w-16 h-16 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all" />
      </UCard>
    </div>

    <!-- Configuration Details -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      <section class="space-y-6">
        <div class="flex items-center gap-2 px-2">
          <UIcon name="i-heroicons-adjustments-horizontal" class="text-neutral-400 w-4 h-4" />
          <h3 class="text-xs font-black uppercase tracking-[0.2em] text-neutral-400">
            Module Configuration
          </h3>
        </div>
        <UCard :ui="{ body: 'p-0' }">
          <ul class="divide-y divide-neutral-100 dark:divide-neutral-900">
            <li class="p-5 flex justify-between items-center hover:bg-neutral-50/50 dark:hover:bg-neutral-900/50 transition-colors">
              <span class="text-sm font-bold text-neutral-600 dark:text-neutral-400">Authentication Forwarding</span>
              <UBadge
                :color="config.forwardAuthHeader ? 'success' : 'warning'"
                variant="subtle"
                size="sm"
                class="font-bold"
              >
                {{ config.forwardAuthHeader ? 'Enabled' : 'Disabled' }}
              </UBadge>
            </li>
            <li class="p-5 flex justify-between items-center hover:bg-neutral-50/50 dark:hover:bg-neutral-900/50 transition-colors">
              <span class="text-sm font-bold text-neutral-600 dark:text-neutral-400">Build Directory</span>
              <UKbd size="sm" class="font-mono text-[10px] opacity-70">.nuxt/sap-odata/generated</UKbd>
            </li>
            <li class="p-5 flex justify-between items-center hover:bg-neutral-50/50 dark:hover:bg-neutral-900/50 transition-colors">
              <span class="text-sm font-bold text-neutral-600 dark:text-neutral-400">Target Framework</span>
              <span class="text-xs font-black text-neutral-500 uppercase tracking-widest">Nitro / Nuxt 4</span>
            </li>
          </ul>
        </UCard>
      </section>

      <section class="space-y-6">
        <div class="flex items-center gap-2 px-2">
          <UIcon name="i-heroicons-command-line" class="text-neutral-400 w-4 h-4" />
          <h3 class="text-xs font-black uppercase tracking-[0.2em] text-neutral-400">
            System Environment
          </h3>
        </div>
        <UCard :ui="{ body: 'p-0' }">
          <ul class="divide-y divide-neutral-100 dark:divide-neutral-900">
            <li class="p-5 flex justify-between items-center hover:bg-neutral-50/50 dark:hover:bg-neutral-900/50 transition-colors">
              <span class="text-sm font-bold text-neutral-600 dark:text-neutral-400">Node.js Runtime</span>
              <span class="text-xs font-mono font-bold text-neutral-500">{{ config.versions?.node || 'unknown' }}</span>
            </li>
            <li class="p-5 flex justify-between items-center hover:bg-neutral-50/50 dark:hover:bg-neutral-900/50 transition-colors">
              <span class="text-sm font-bold text-neutral-600 dark:text-neutral-400">Module Version</span>
              <UBadge variant="subtle" color="neutral" size="sm" class="font-mono font-bold">
                {{ config.versions?.module || '1.0.0' }}
              </UBadge>
            </li>
            <li class="p-5 flex justify-between items-center hover:bg-neutral-50/50 dark:hover:bg-neutral-900/50 transition-colors">
              <span class="text-sm font-bold text-neutral-600 dark:text-neutral-400">License</span>
              <span class="text-xs font-bold text-neutral-500 uppercase tracking-widest">Proprietary / AGPL</span>
            </li>
          </ul>
        </UCard>
      </section>
    </div>
  </div>
</template>
