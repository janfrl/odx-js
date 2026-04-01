<script setup lang="ts">
import { computed } from 'vue'
import { useSharedODataState } from '../composables/useODataState'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits(['update:open'])

const isOpen = computed({
  get: () => props.open,
  set: value => emit('update:open', value),
})

const { selectedService } = useSharedODataState()

const service = computed(() => selectedService.value)

const authSummary = computed(() => {
  if (!service.value?.auth)
    return 'None'
  const parts = []
  if (service.value.auth.username)
    parts.push(`User: ${service.value.auth.username}`)
  if (service.value.auth.bearerToken)
    parts.push('Bearer Token active')
  return parts.length > 0 ? parts.join(', ') : 'None'
})

const headerCount = computed(() => {
  return Object.keys(service.value?.headers || {}).length
})
</script>

<template>
  <USlideover
    v-model:open="isOpen"
    :description="service?.name"
    :ui="{ body: 'bg-muted' }"
  >
    <template #title>
      <div class="flex items-center gap-2">
        <UIcon :name="service?.icon || 'i-lucide-database'" class="w-5 h-5 text-muted" />
        <span>Service Settings</span>
      </div>
    </template>

    <template #body>
      <div v-if="service" class="space-y-6 py-2">
        <!-- General Information -->
        <section class="bg-default rounded-xl ring-1 ring-default shadow-sm overflow-hidden">
          <div class="px-4 py-3 border-b border-default bg-default/50">
            <h3 class="text-xs font-bold text-default flex items-center gap-2 uppercase tracking-tight">
              <UIcon name="i-lucide-info" class="w-3.5 h-3.5 text-primary" />
              General Information
            </h3>
          </div>
          <div class="p-4 space-y-4">
            <div class="flex flex-col gap-1.5">
              <span class="text-[10px] font-bold text-default uppercase tracking-wider">Target URL</span>
              <div class="text-[11px] font-mono text-toned break-all leading-relaxed">
                {{ service.url }}
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4 pt-2">
              <div class="flex flex-col gap-1">
                <span class="text-[10px] font-bold text-default uppercase tracking-wider">OData Version</span>
                <div class="flex">
                  <UBadge size="sm" variant="soft" color="neutral" class="uppercase font-bold px-2">
                    {{ service.version || 'unknown' }}
                  </UBadge>
                </div>
              </div>
              <div class="flex flex-col gap-1">
                <span class="text-[10px] font-bold text-default uppercase tracking-wider">Strategy</span>
                <div class="flex">
                  <UBadge size="sm" variant="subtle" :color="service.strategy === 'direct' ? 'warning' : 'primary'" class="uppercase font-bold px-2">
                    {{ service.strategy || 'proxied' }}
                  </UBadge>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Proxy & BTP -->
        <section class="bg-default rounded-xl ring-1 ring-default shadow-sm overflow-hidden">
          <div class="px-4 py-3 border-b border-default bg-default/50">
            <h3 class="text-xs font-bold text-default flex items-center gap-2 uppercase tracking-tight">
              <UIcon name="i-lucide-layers" class="w-3.5 h-3.5 text-primary" />
              Runtime Configuration
            </h3>
          </div>
          <div class="p-4 space-y-4">
            <div class="flex justify-between items-center gap-4">
              <span class="text-[10px] font-bold text-default uppercase tracking-wider">Proxy Mode</span>
              <UBadge size="sm" variant="soft" color="neutral" class="uppercase font-bold">
                {{ service.proxyMode || 'stream' }}
              </UBadge>
            </div>
            <div v-if="service.destination" class="flex justify-between items-center gap-4 border-t border-default pt-3">
              <span class="text-[10px] font-bold text-default uppercase tracking-wider">BTP Destination</span>
              <span class="text-xs font-mono font-bold text-primary">{{ service.destination }}</span>
            </div>
          </div>
        </section>

        <!-- Authentication -->
        <section class="bg-default rounded-xl ring-1 ring-default shadow-sm overflow-hidden">
          <div class="px-4 py-3 border-b border-default bg-default/50">
            <h3 class="text-xs font-bold text-default flex items-center gap-2 uppercase tracking-tight">
              <UIcon name="i-lucide-shield-check" class="w-3.5 h-3.5 text-primary" />
              Authentication
            </h3>
          </div>
          <div class="p-4 space-y-4">
            <div class="flex flex-col gap-1">
              <span class="text-[10px] font-bold text-default uppercase tracking-wider">Security Profile</span>
              <p class="text-xs text-toned">
                {{ authSummary }}
              </p>
            </div>
            <div v-if="service.auth?.mockUserCompanies" class="pt-3 border-t border-default">
              <span class="text-[10px] font-bold text-default uppercase tracking-wider block mb-2">Mock Companies</span>
              <div class="flex flex-wrap gap-1.5">
                <UBadge v-for="c in service.auth.mockUserCompanies" :key="c.company" size="sm" variant="soft" color="neutral" class="font-medium">
                  {{ c.company }} ({{ c.source }})
                </UBadge>
              </div>
            </div>
          </div>
        </section>

        <!-- Headers -->
        <section v-if="headerCount > 0" class="bg-default rounded-xl ring-1 ring-default shadow-sm overflow-hidden">
          <div class="px-4 py-3 border-b border-default bg-default/50">
            <h3 class="text-xs font-bold text-default flex items-center gap-2 uppercase tracking-tight">
              <UIcon name="i-lucide-list" class="w-3.5 h-3.5 text-primary" />
              Static Headers ({{ headerCount }})
            </h3>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left text-[10px] border-collapse">
              <thead class="bg-muted">
                <tr>
                  <th class="px-4 py-2 border-b border-default text-default font-bold uppercase tracking-wider">
                    Key
                  </th>
                  <th class="px-4 py-2 border-b border-default text-default font-bold uppercase tracking-wider">
                    Value
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-default">
                <tr v-for="(value, key) in service.headers" :key="key" class="hover:bg-muted transition-colors">
                  <td class="px-4 py-2.5 font-mono font-bold text-default whitespace-nowrap">
                    {{ key }}
                  </td>
                  <td class="px-4 py-2.5 font-mono text-muted break-all">
                    {{ value }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
      <div v-else class="flex flex-col items-center justify-center h-full text-muted py-12">
        <UIcon name="i-lucide-alert-circle" class="w-12 h-12 mb-4 opacity-10" />
        <p class="text-sm font-medium">
          No service selected
        </p>
      </div>
    </template>
  </USlideover>
</template>
