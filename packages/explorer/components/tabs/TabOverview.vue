<script setup lang="ts">
import { hasGeneratedTypes } from '../../composables/useODataState'

const { config, services } = useSharedODataState()

const stats = computed(() => [
  { label: 'Status', value: 'Active', icon: 'i-lucide-circle-check' },
  { label: 'Mode', value: config.value.mode, icon: 'i-lucide-cpu' },
  { label: 'Base Path', value: config.value.basePath, icon: 'i-lucide-link' },
  { label: 'Services', value: services.value.length.toString(), icon: 'i-lucide-server' },
])

const metadataSummary = computed(() => {
  const states = services.value.map(service => service.metadata?.status || 'unknown')
  if (states.includes('missing'))
    return 'Missing'
  if (states.includes('stale'))
    return 'Stale'
  if (states.includes('available'))
    return 'Available'
  return 'Checking'
})

const configItems = computed(() => [
  { id: 'auth', label: 'Auth Forwarding', type: 'badge', value: config.value.forwardAuthHeader },
  { id: 'metadata', label: 'Runtime Metadata', type: 'text', value: metadataSummary.value },
  { id: 'types', label: 'Generated Types', type: 'text', value: hasGeneratedTypes(config.value) ? 'Available in development' : 'Build-time only' },
  { id: 'api', label: 'ODX API Base', type: 'code', value: config.value.apiBase || 'same origin' },
])

const runtimeItems = computed(() => [
  { id: 'node', label: 'Node.js', type: 'code', value: config.value.versions?.node || 'unknown' },
  { id: 'module', label: 'Module', type: 'code', value: `v${config.value.versions?.module}` },
])
</script>

<template>
  <div class="h-full flex flex-col overflow-hidden font-sans">
    <TabHeader
      title="System Overview"
      description="Configuration details and runtime status of the SAP OData module."
    />

    <div class="flex-1 overflow-y-auto custom-scrollbar px-6 pt-0 pb-8 lg:pb-12 bg-transparent">
      <div class="w-full space-y-12 pt-6">
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
            <h3 class="text-xs font-semibold text-muted uppercase tracking-widest flex items-center gap-2.5 mb-4">
              <UIcon name="i-lucide-sliders-horizontal" class="w-4 h-4 text-muted" />
              Configuration
            </h3>
            <div class="border-y border-default divide-y divide-default">
              <div v-for="item in configItems" :key="item.id" class="py-3.5 flex justify-between items-center">
                <span class="text-sm font-medium text-toned">{{ item.label }}</span>
                <UBadge v-if="item.type === 'badge'" :color="item.value ? 'success' : 'neutral'" variant="subtle" size="sm">
                  {{ item.value ? 'Enabled' : 'Disabled' }}
                </UBadge>
                <code v-else-if="item.type === 'code'" class="text-[11px] font-mono text-default bg-muted px-2 py-1 rounded">
                  {{ item.value }}
                </code>
                <span v-else class="text-sm font-medium text-default">{{ item.value }}</span>
              </div>
            </div>
          </section>

          <section>
            <h3 class="text-xs font-semibold text-muted uppercase tracking-widest flex items-center gap-2.5 mb-4">
              <UIcon name="i-lucide-terminal" class="w-4 h-4 text-muted" />
              Runtime
            </h3>
            <div class="border-y border-default divide-y divide-default">
              <div v-for="item in runtimeItems" :key="item.id" class="py-3.5 flex justify-between items-center">
                <span class="text-sm font-medium text-toned">{{ item.label }}</span>
                <code v-if="item.type === 'code'" class="text-[11px] font-mono text-default bg-muted px-2 py-1 rounded">{{ item.value }}</code>
                <span v-else class="text-sm font-medium text-default">{{ item.value }}</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>
