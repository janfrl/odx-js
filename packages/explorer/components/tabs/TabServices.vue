<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import { computed } from 'vue'
import { useSharedODataState } from '../../composables/useODataState'
import EntityExplorer from '../EntityExplorer.vue'
import SchemaExplorer from '../SchemaExplorer.vue'

const RE_TRAILING_SLASH = /\/$/

const {
  services,
  selectedService,
  config,
  generateService,
  generatingStatus,
  selectedEntity,
  globalViewMode,
  activeTab,
  logFilterService,
} = useSharedODataState()
const toast = useToast()

function viewLogs(service: any) {
  const identifier = (service.route || service.name).toLowerCase()
  logFilterService.value = identifier
  activeTab.value = 'logs'
}

const tabs = [
  { label: 'Data', icon: 'i-lucide-table-2', value: 'explorer' },
  { label: 'Schema', icon: 'i-lucide-share-2', value: 'schema' },
]

const metadataUrl = computed((): string => {
  if (!selectedService.value)
    return ''
  return `/__odx__/schema?service=${selectedService.value.name}&raw=true`
})

async function onRegenerate() {
  if (!selectedService.value)
    return
  try {
    await generateService(selectedService.value.name)
    toast.add({
      id: 'gen-success',
      title: 'SDK Regenerated',
      description: `Models for ${selectedService.value.name} are now up to date.`,
      icon: 'i-lucide-check-circle',
      color: 'success',
    })
  }
  catch (e: any) {
    toast.add({
      id: 'gen-error',
      title: 'Generation Failed',
      description: e.message || 'An unexpected error occurred during SDK generation.',
      icon: 'i-lucide-circle-x',
      color: 'error',
    })
  }
}

const actionItems = computed((): DropdownMenuItem[][] => {
  if (!selectedService.value)
    return []

  const isOffline = selectedService.value.health === 'offline'
  const menu: DropdownMenuItem[][] = [[]]

  // If online, Regenerate is in the dropdown. If offline, it's the primary button.
  if (!isOffline) {
    menu[0]!.push({
      label: 'Regenerate SDK',
      icon: 'i-lucide-refresh-cw',
      loading: generatingStatus.value[selectedService.value.name],
      onSelect: onRegenerate,
    })
  }

  // Metadata links
  const metadataGroup: DropdownMenuItem[] = []

  // Internal metadata (only if online)
  if (!isOffline) {
    metadataGroup.push({
      label: 'Internal Metadata',
      icon: 'i-lucide-file-code',
      onSelect: () => {
        window.open(metadataUrl.value, '_blank')
      },
    })
  }

  // External metadata link (always show if URL is external)
  if (selectedService.value.url?.startsWith('http')) {
    const extUrl = `${selectedService.value.url.replace(RE_TRAILING_SLASH, '')}/$metadata`

    metadataGroup.push({
      label: 'External Metadata',
      icon: 'i-lucide-external-link',
      onSelect: () => {
        window.open(extUrl, '_blank')
      },
    })
  }

  if (metadataGroup.length > 0) {
    menu.push(metadataGroup)
  }

  return menu.filter(group => group.length > 0)
})
</script>

<template>
  <div class="h-full flex flex-col">
    <div
      v-if="!selectedService"
      class="h-full flex flex-col overflow-hidden"
    >
      <TabHeader
        title="OData Services"
        description="Select a registered service to explore its entities, metadata, and generated SDK."
      />

      <div class="flex-1 overflow-y-auto custom-scrollbar px-6 pt-2 pb-8">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 w-full">
          <UPageCard
            v-for="svc in services"
            :key="svc.name"
            :title="svc.name"
            :description="`${config.basePath}/${svc.route || svc.name.toLowerCase()}`"
            :icon="svc.icon || 'i-lucide-database'"
            variant="subtle"
            to="#"
            :ui="{ leadingIcon: svc.health === 'offline' ? 'text-error' : 'text-primary' }"
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
    </div>

    <div
      v-else
      class="h-full flex flex-col overflow-hidden"
    >
      <div class="p-6 flex flex-wrap items-center justify-between gap-x-8 gap-y-4 shrink-0">
        <!-- Service Title Section -->
        <div class="flex items-center gap-4 min-w-50 flex-1">
          <UButton
            icon="i-lucide-chevron-left"
            color="neutral"
            variant="ghost"
            @click="selectedService = null; selectedEntity = null"
          />
          <div class="min-w-0">
            <h2 class="text-lg font-bold text-neutral-900 dark:text-neutral-100 truncate flex items-center gap-2">
              {{ selectedService.name }}
              <div v-if="selectedService.health === 'offline'" class="w-2.5 h-2.5 rounded-full bg-error-500 animate-pulse" title="Service unreachable" />
            </h2>
            <div class="text-xs font-mono text-neutral-500 dark:text-neutral-400 truncate">
              {{ config.basePath }}/{{ selectedService.route || selectedService.name.toLowerCase() }}
            </div>
          </div>
        </div>

        <!-- Actions Section -->
        <div class="flex items-center justify-end gap-3 shrink-0 flex-1">
          <UFieldGroup class="-mt-2">
            <UButton
              icon="i-lucide-activity"
              color="neutral"
              variant="subtle"
              label="Logs"
              title="View Traffic Logs"
              @click="viewLogs(selectedService)"
            />
          </UFieldGroup>

          <UFieldGroup class="-mt-2">
            <!-- If offline, Regenerate is primary. If online, Metadata is primary. -->
            <UButton
              v-if="selectedService.health === 'offline'"
              icon="i-lucide-refresh-cw"
              color="neutral"
              variant="subtle"
              label="Regenerate SDK"
              :loading="generatingStatus[selectedService.name]"
              @click="onRegenerate"
            />
            <UButton
              v-else
              icon="i-lucide-file-code"
              color="neutral"
              variant="subtle"
              label="Metadata"
              :to="metadataUrl"
              target="_blank"
              title="Open internal EDMX"
              :external="true"
            />

            <UDropdownMenu :items="actionItems">
              <UButton
                color="neutral"
                variant="outline"
                icon="i-lucide-chevron-down"
              />
            </UDropdownMenu>
          </UFieldGroup>

          <UTabs
            v-model="globalViewMode"
            :items="tabs"
            size="sm"
            color="neutral"
            class="w-48"
            :ui="{ list: 'bg-neutral-100 dark:bg-neutral-900', indicator: 'bg-white dark:bg-neutral-700 shadow-sm ring-1 ring-neutral-200 dark:ring-neutral-600', trigger: 'text-neutral-500 dark:text-neutral-400 font-semibold transition-colors data-[state=active]:text-neutral-900 dark:data-[state=active]:text-white' }"
          />
        </div>
      </div>

      <div class="flex-1 overflow-hidden relative">
        <EntityExplorer v-show="globalViewMode === 'explorer'" />
        <SchemaExplorer v-show="globalViewMode === 'schema'" />
      </div>
    </div>
  </div>
</template>
