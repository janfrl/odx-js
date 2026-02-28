<script setup lang="ts">
import { useSharedODataState } from '../../composables/useODataState'
import EntityExplorer from '../EntityExplorer.vue'
import SchemaExplorer from '../SchemaExplorer.vue'

const { services, selectedService, config, generateService, generatingStatus, selectedEntity, globalViewMode } = useSharedODataState()
const toast = useToast()

const tabs = [
  { label: 'Data', icon: 'i-lucide-table-2', value: 'explorer' },
  { label: 'Schema', icon: 'i-lucide-share-2', value: 'schema' },
]

/**
 * Regenerates the SDK for a given service.
 */
async function runGenerate(name: string) {
  await generateService(name)
  toast.add({
    title: `SDK for ${name} regenerated successfully`,
    icon: 'i-lucide-circle-check',
    color: 'success',
  })
}
</script>

<template>
  <div class="h-full flex flex-col">
    <div
      v-if="!selectedService"
      class="p-6 lg:p-10 space-y-8 overflow-y-auto custom-scrollbar"
    >
      <header class="flex flex-col gap-1.5">
        <h1 class="text-xl font-bold text-neutral-900 dark:text-white tracking-tight">
          OData Services
        </h1>
        <p class="text-sm text-neutral-500 dark:text-neutral-400">
          Select a registered service to explore its entities, metadata, and generated SDK.
        </p>
      </header>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <UPageCard
          v-for="svc in services"
          :key="svc.name"
          :title="svc.name"
          :description="`${config.basePath}/${svc.route || svc.name.toLowerCase()}`"
          :icon="svc.icon || 'i-lucide-database'"
          variant="subtle"
          to="#"
          @click.prevent="selectedService = svc"
        >
          <template #footer>
            <div class="flex items-center gap-2">
              <UBadge
                v-if="svc.version"
                color="neutral"
                variant="soft"
                size="sm"
              >
                {{ svc.version }}
              </UBadge>

              <UBadge
                color="neutral"
                variant="soft"
                size="sm"
                class="uppercase tracking-widest text-[10px]"
              >
                {{ svc.strategy || 'proxied' }}
              </UBadge>
            </div>
          </template>
        </UPageCard>
      </div>
    </div>

    <div
      v-else
      class="h-full flex flex-col overflow-hidden"
    >
      <div class="p-6 flex items-center gap-4 shrink-0">
        <UButton
          icon="i-lucide-chevron-left"
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
              icon="i-lucide-refresh-cw"
              color="neutral"
              variant="ghost"
              size="xs"
              :loading="generatingStatus[selectedService.name]"
              @click="runGenerate(selectedService.name)"
            />
          </div>
          <div class="text-xs font-mono text-neutral-500 dark:text-neutral-400">
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
