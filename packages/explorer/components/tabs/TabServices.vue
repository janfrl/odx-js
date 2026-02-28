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
          variant="subtle"
          to="#"
          class="cursor-pointer group"
          :icon="svc.icon || 'i-lucide-database'"
          @click.prevent="selectedService = svc"
        >
          <div class="absolute top-6 right-6 flex items-center gap-2">
            <span
              class="text-[10px] font-bold uppercase tracking-widest"
              :class="svc.isGenerated ? 'text-success-600 dark:text-success-500' : 'text-neutral-500 dark:text-neutral-400'"
            >
              {{ svc.isGenerated ? 'Generated' : 'Pending' }}
            </span>
            <div
              class="w-1.5 h-1.5 rounded-full"
              :class="svc.isGenerated ? 'bg-success-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-neutral-400 dark:bg-neutral-600'"
            />
          </div>

          <template #icon>
            <UIcon
              :name="svc.icon || 'i-lucide-database'"
              class="w-7 h-7 mb-4 transition-transform group-hover:scale-110 text-neutral-400 dark:text-neutral-500 group-hover:text-primary-500 dark:group-hover:text-primary-400"
            />
          </template>

          <template #title>
            <div class="flex items-center gap-2">
              <span class="text-xl font-bold text-neutral-900 dark:text-white tracking-tight truncate">
                {{ svc.name }}
              </span>
              <UBadge
                v-if="svc.version"
                color="neutral"
                variant="soft"
                size="sm"
                class="text-[10px] font-mono px-1.5 py-0.5"
              >
                {{ svc.version }}
              </UBadge>
            </div>
          </template>

          <template #description>
            <span class="text-xs font-mono text-neutral-500 dark:text-neutral-400 truncate block mt-1">
              {{ config.basePath }}/{{ svc.route || svc.name.toLowerCase() }}
            </span>
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
          :ui="{ list: 'bg-neutral-100 dark:bg-neutral-900', indicator: 'bg-white dark:bg-neutral-700 shadow-sm ring-1 ring-neutral-200 dark:ring-neutral-600', trigger: 'text-neutral-500 dark:text-neutral-400 font-semibold transition-colors data-[state=active]:text-neutral-900 dark:data-[state=active]:text-white' }"
        />
      </div>

      <div class="flex-1 overflow-hidden relative">
        <EntityExplorer v-show="globalViewMode === 'explorer'" />
        <SchemaExplorer v-show="globalViewMode === 'schema'" />
      </div>
    </div>
  </div>
</template>
