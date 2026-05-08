<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import { computed, ref } from 'vue'
import { buildSchemaEndpointUrl, supportsSdkGeneration, useSharedODataState } from '../../composables/useODataState'
import EntityExplorer from '../EntityExplorer.vue'
import SchemaExplorer from '../SchemaExplorer.vue'
import ServiceSettings from '../ServiceSettings.vue'

const RE_TRAILING_SLASH = /\/$/

const showSettings = ref(false)
const {
  services,
  selectedService,
  config,
  refreshServiceMetadata,
  generatingStatus,
  selectedEntity,
  globalViewMode,
  activeTab,
  logFilterService,
} = useSharedODataState()
const toast = useToast()

function viewLogs(service: any) {
  logFilterService.value = service.name.toLowerCase()
  activeTab.value = 'logs'
}

const tabs = [
  { label: 'Data', icon: 'i-lucide-table-2', value: 'explorer' },
  { label: 'Schema', icon: 'i-lucide-share-2', value: 'schema' },
]

const metadataUrl = computed((): string => {
  if (!selectedService.value)
    return ''
  return buildSchemaEndpointUrl(selectedService.value.name, { raw: true })
})

function metadataStatusLabel(service: any): string {
  if (service.metadata?.status === 'stale')
    return 'Stale metadata'
  if (service.metadata?.status === 'missing')
    return 'Missing metadata'
  if (service.metadata?.status === 'available')
    return 'Metadata available'
  return 'Checking metadata'
}

function metadataStatusColor(service: any): 'success' | 'warning' | 'error' | 'neutral' {
  if (service.metadata?.status === 'stale')
    return 'warning'
  if (service.metadata?.status === 'missing')
    return 'error'
  if (service.metadata?.status === 'available')
    return 'success'
  return 'neutral'
}

const selectedRouteUrl = computed(() => {
  if (!selectedService.value)
    return ''
  return `${config.value.basePath}/${selectedService.value.route || selectedService.value.name.toLowerCase()}`
})

const selectedMetadataMessage = computed(() => {
  const metadata = selectedService.value?.metadata
  if (!metadata)
    return 'Metadata state is being checked.'
  if (metadata.status === 'missing')
    return metadata.message || 'Refresh metadata before browsing this service schema.'
  if (metadata.status === 'stale') {
    return metadata.staleReason
      ? `Using cached metadata. Last refresh failed: ${metadata.staleReason}`
      : 'Using cached metadata from the last successful refresh.'
  }
  return metadata.refreshedAt ? `Last refreshed ${metadata.refreshedAt}` : 'Runtime metadata is available.'
})

const selectedSupportsSdkGeneration = computed(() => {
  return selectedService.value ? supportsSdkGeneration(config.value, selectedService.value) : false
})

const refreshActionLabel = computed(() => {
  return selectedSupportsSdkGeneration.value ? 'Regenerate SDK' : 'Refresh Metadata'
})

const refreshActionIcon = computed(() => {
  return selectedSupportsSdkGeneration.value ? 'i-lucide-code-2' : 'i-lucide-refresh-cw'
})

async function onRefreshMetadata() {
  if (!selectedService.value)
    return
  try {
    const result = await refreshServiceMetadata(selectedService.value.name)
    toast.add({
      id: 'gen-success',
      title: result?.generated ? 'SDK Regenerated' : 'Metadata Refreshed',
      description: result?.generated
        ? `Types for ${selectedService.value.name} were regenerated from current metadata.`
        : `Runtime metadata for ${selectedService.value.name} is up to date.`,
      icon: 'i-lucide-check-circle',
      color: 'success',
    })
  }
  catch (e: any) {
    toast.add({
      id: 'gen-error',
      title: e.stale ? 'Using Cached Metadata' : 'Metadata Refresh Failed',
      description: e.stale
        ? `Backend unreachable - using cached metadata. ${e.message}`
        : (e.message || 'An unexpected error occurred during metadata refresh.'),
      icon: e.stale ? 'i-lucide-triangle-alert' : 'i-lucide-circle-x',
      color: e.stale ? 'warning' : 'error',
    })
  }
}

const actionItems = computed((): DropdownMenuItem[][] => {
  if (!selectedService.value)
    return []

  const isOffline = selectedService.value.health === 'offline' || selectedService.value.health === 'degraded'
  const hasCachedSchema = selectedService.value.health !== 'offline'
  const menu: DropdownMenuItem[][] = [[]]

  // If online, refresh is in the dropdown. If offline/degraded, it's the primary button.
  if (!isOffline) {
    menu[0]!.push({
      label: refreshActionLabel.value,
      icon: refreshActionIcon.value,
      loading: generatingStatus.value[selectedService.value.name],
      onSelect: onRefreshMetadata,
    })
  }

  // Metadata links
  const metadataGroup: DropdownMenuItem[] = []

  // Internal metadata available as long as local schema exists (online or degraded)
  if (hasCachedSchema) {
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
        description="Select a registered service to explore its entities, runtime metadata, and schema."
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
            :ui="{ leadingIcon: svc.health === 'offline' ? 'text-error' : (svc.health === 'degraded' ? 'text-warning-400' : (svc.health === 'online' ? 'text-primary' : 'text-neutral-500')) }"
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
                  :color="metadataStatusColor(svc)"
                  variant="subtle"
                  size="sm"
                >
                  {{ metadataStatusLabel(svc) }}
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
            <h2 class="text-lg font-bold text-default truncate flex items-center gap-2">
              {{ selectedService.name }}
              <div
                class="w-2.5 h-2.5 rounded-full"
                :class="{
                  'bg-success-500': selectedService.health === 'online',
                  'bg-error-500 animate-pulse': selectedService.health === 'offline',
                  'bg-warning-400 animate-pulse': selectedService.health === 'degraded',
                  'bg-neutral-400': selectedService.health === 'checking',
                }"
                :title="selectedService.health === 'degraded' ? selectedMetadataMessage : `Service ${selectedService.health}`"
              />
            </h2>
            <div class="text-xs font-mono text-muted truncate">
              {{ selectedRouteUrl }}
            </div>
            <div class="mt-2 flex flex-wrap items-center gap-2">
              <UBadge
                :color="metadataStatusColor(selectedService)"
                variant="subtle"
                size="sm"
              >
                {{ metadataStatusLabel(selectedService) }}
              </UBadge>
              <span class="text-xs text-muted truncate max-w-120">
                {{ selectedMetadataMessage }}
              </span>
            </div>
          </div>
        </div>

        <!-- Actions Section -->
        <div class="flex items-center justify-end gap-3 shrink-0 flex-1">
          <UFieldGroup class="-mt-2">
            <UButton
              icon="i-lucide-settings"
              color="neutral"
              variant="subtle"
              label="Settings"
              title="Service Configuration"
              @click="showSettings = true"
            />
          </UFieldGroup>

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
            <!-- If offline/degraded, metadata refresh is primary. If online, metadata is primary. -->
            <UButton
              v-if="selectedService.health === 'offline' || selectedService.health === 'degraded'"
              :icon="refreshActionIcon"
              color="neutral"
              variant="subtle"
              :label="refreshActionLabel"
              :loading="generatingStatus[selectedService.name]"
              @click="onRefreshMetadata"
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
            :ui="{
              list: 'bg-neutral-100 dark:bg-default',
              indicator: 'bg-white dark:bg-accented shadow-sm ring-1 ring-neutral-200 dark:ring-neutral-600',
              trigger: 'text-muted font-semibold transition-colors data-[state=active]:text-highlighted',
            }"
          />
        </div>
      </div>

      <div class="flex-1 overflow-hidden relative">
        <EntityExplorer v-show="globalViewMode === 'explorer'" />
        <SchemaExplorer v-show="globalViewMode === 'schema'" />
      </div>

      <ServiceSettings v-model:open="showSettings" />
    </div>
  </div>
</template>
