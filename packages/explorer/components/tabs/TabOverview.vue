<script setup lang="ts">
const { config, services } = useSharedODataState()

const stats = computed(() => [
  { label: 'Status', value: 'Active', icon: 'i-lucide-circle-check' },
  { label: 'Mode', value: config.value.mode, icon: 'i-lucide-cpu' },
  { label: 'Base Path', value: config.value.basePath, icon: 'i-lucide-link' },
  { label: 'Services', value: services.value.length.toString(), icon: 'i-lucide-server' },
])

const configItems = computed(() => [
  { id: 'auth', label: 'Auth Forwarding', type: 'badge', value: config.value.forwardAuthHeader },
  { id: 'build', label: 'Build Directory', type: 'code', value: '.nuxt/sap-odata/generated' },
])

const runtimeItems = computed(() => [
  { label: 'Node.js', value: config.value.versions?.node || 'unknown' },
  { label: 'Module', value: `v${config.value.versions?.module || '1.0.0'}` },
])
</script>

<template>
  <div class="p-6 lg:p-10 space-y-12 overflow-y-auto custom-scrollbar h-full bg-neutral-50/30 dark:bg-neutral-950/30">
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      <UPageCard
        v-for="stat in stats"
        :key="stat.label"
        :icon="stat.icon"
        :title="stat.value"
        :description="stat.label"
      />
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 pt-2">
      <section>
        <h3 class="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest flex items-center gap-2.5 mb-4">
          <UIcon name="i-lucide-sliders-horizontal" class="w-4 h-4 text-neutral-400 dark:text-neutral-500" />
          Configuration
        </h3>

        <div class="border-y border-neutral-200 dark:border-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-800">
          <div v-for="item in configItems" :key="item.id" class="py-3.5 flex justify-between items-center">
            <span class="text-sm font-medium text-neutral-600 dark:text-neutral-400">{{ item.label }}</span>

            <UBadge v-if="item.type === 'badge'" :color="item.value ? 'success' : 'neutral'" variant="subtle" size="sm">
              {{ item.value ? 'Enabled' : 'Disabled' }}
            </UBadge>

            <code v-else-if="item.type === 'code'" class="text-[11px] font-mono text-neutral-900 dark:text-neutral-300 bg-neutral-200/50 dark:bg-neutral-800/50 px-2 py-1 rounded">
              {{ item.value }}
            </code>
          </div>
        </div>
      </section>

      <section>
        <h3 class="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest flex items-center gap-2.5 mb-4">
          <UIcon name="i-lucide-terminal" class="w-4 h-4 text-neutral-400 dark:text-neutral-500" />
          Runtime
        </h3>

        <div class="border-y border-neutral-200 dark:border-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-800">
          <div v-for="item in runtimeItems" :key="item.label" class="py-3.5 flex justify-between items-center">
            <span class="text-sm font-medium text-neutral-600 dark:text-neutral-400">{{ item.label }}</span>
            <span class="text-sm font-medium text-neutral-900 dark:text-neutral-200">{{ item.value }}</span>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
