<script setup lang="ts">
import { useSharedODataState } from '../../composables/useODataState'
import EntityExplorer from '../EntityExplorer.vue'
import SchemaExplorer from '../SchemaExplorer.vue'

const { services, selectedService, config, generateService, generatingStatus, selectedEntity, globalViewMode } = useSharedODataState()
const toast = useToast()

const tabs = [
  { label: 'Data', icon: 'i-heroicons-table-cells', value: 'explorer' },
  { label: 'Schema', icon: 'i-heroicons-share', value: 'schema' },
]

/**
 * Regenerates the SDK for a given service.
 */
async function runGenerate(name: string) {
  await generateService(name)
  toast.add({
    title: `SDK for ${name} regenerated successfully`,
    icon: 'i-heroicons-check-circle',
    color: 'success',
  })
}
</script>

<template>
  <div class="h-full flex flex-col">
    <div
      v-if="!selectedService"
      class="p-8 space-y-8 overflow-y-auto custom-scrollbar"
    >
      <h2 class="text-xs font-bold uppercase tracking-[0.2em] text-neutral-400">
        Registered OData Services
      </h2>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <UCard
          v-for="svc in services"
          :key="svc.name"
          class="cursor-pointer transition-all hover:ring-2 hover:ring-primary-500/50 group"
          :ui="{ body: 'p-6' }"
          @click="selectedService = svc"
        >
          <div class="flex items-start gap-4">
            <div class="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-400 group-hover:text-primary-500 transition-colors">
              <UIcon
                name="i-heroicons-circle-stack"
                class="w-6 h-6"
              />
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2 mb-1">
                <span class="font-bold truncate text-neutral-900 dark:text-neutral-100">{{ svc.name }}</span>
                <UBadge
                  v-if="svc.version"
                  color="neutral"
                  variant="subtle"
                  size="sm"
                  class="text-[10px] font-mono"
                >
                  {{ svc.version }}
                </UBadge>
              </div>
              <div class="text-xs text-neutral-500 font-mono truncate">
                {{ config.basePath }}/{{ svc.route || svc.name.toLowerCase() }}
              </div>
            </div>
          </div>

          <template #footer>
            <div class="flex justify-between items-center text-[10px] uppercase font-bold tracking-widest">
              <span class="text-neutral-400">Generation</span>
              <div class="flex items-center gap-2">
                <span :class="svc.isGenerated ? 'text-success-500' : 'text-warning-500'">
                  {{ svc.isGenerated ? 'Completed' : 'Pending' }}
                </span>
                <div
                  class="w-1.5 h-1.5 rounded-full"
                  :class="svc.isGenerated ? 'bg-success-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-warning-500'"
                />
              </div>
            </div>
          </template>
        </UCard>
      </div>
    </div>

    <div
      v-else
      class="h-full flex flex-col overflow-hidden"
    >
      <div class="p-6 flex items-center gap-4 shrink-0">
        <UButton
          icon="i-heroicons-chevron-left"
          color="neutral"
          variant="ghost"
          @click="selectedService = null; selectedEntity = null"
        />
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <h2 class="text-lg font-bold text-neutral-900 dark:text-neutral-100">
              {{ selectedService.name }}
            </h2>
            <UButton
              icon="i-heroicons-arrow-path"
              color="neutral"
              variant="ghost"
              size="xs"
              :loading="generatingStatus[selectedService.name]"
              @click="runGenerate(selectedService.name)"
            />
          </div>
          <div class="text-xs font-mono text-muted">
            {{ config.basePath }}/{{ selectedService.route || selectedService.name.toLowerCase() }}
          </div>
        </div>

        <UTabs
          v-model="globalViewMode"
          :items="tabs"
          size="sm"
          class="w-48"
        />
      </div>

      <div class="flex-1 overflow-hidden relative">
        <EntityExplorer v-show="globalViewMode === 'explorer'" />
        <SchemaExplorer v-show="globalViewMode === 'schema'" />
      </div>
    </div>
  </div>
</template>
