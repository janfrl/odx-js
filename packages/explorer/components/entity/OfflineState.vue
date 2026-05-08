<script setup lang="ts">
import { supportsSdkGeneration, useSharedODataState } from '../../composables/useODataState'

const { config, selectedService, generatingStatus, refreshServiceMetadata } = useSharedODataState()
const toast = useToast()

const title = computed(() => {
  if (selectedService.value?.metadata?.status === 'missing')
    return 'Metadata Missing'
  if (selectedService.value?.metadata?.status === 'stale')
    return 'Metadata Stale'
  return 'Service Unreachable'
})

const description = computed(() => {
  const metadata = selectedService.value?.metadata
  if (metadata?.status === 'missing')
    return metadata.message || 'No runtime metadata is available yet. Refresh metadata before browsing entities or schema.'
  if (metadata?.status === 'stale') {
    return metadata.staleReason
      ? `Cached metadata is being used. Last refresh failed: ${metadata.staleReason}`
      : 'Cached metadata is being used because the latest refresh did not complete.'
  }
  return 'The OData service at this endpoint is currently not responding. This might be due to network restrictions, a server-side issue, or an invalid URL.'
})

const refreshActionLabel = computed(() => {
  return supportsSdkGeneration(config.value, selectedService.value) ? 'Regenerate SDK' : 'Refresh Metadata'
})

const refreshActionIcon = computed(() => {
  return supportsSdkGeneration(config.value, selectedService.value) ? 'i-lucide-code-2' : 'i-lucide-refresh-cw'
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
</script>

<template>
  <div
    class="flex-1 flex flex-col items-center justify-center text-center p-12 bg-error-50/5 dark:bg-error-900/5 border-2 border-dashed border-error-500/30 rounded-t-2xl transition-all"
  >
    <div class="w-16 h-16 rounded-2xl bg-error-100 dark:bg-error-900/20 border border-error-500/50 flex items-center justify-center mb-6 shadow-sm">
      <UIcon name="i-lucide-circle-off" class="text-error-500 w-8 h-8" />
    </div>
    <h3 class="text-sm font-bold uppercase tracking-widest mb-2 text-default">
      {{ title }}
    </h3>
    <p class="text-[12px] text-muted max-w-70 leading-relaxed mb-6">
      {{ description }}
    </p>

    <div class="flex items-center gap-3">
      <UButton
        v-if="selectedService"
        :icon="refreshActionIcon"
        color="neutral"
        variant="subtle"
        :label="refreshActionLabel"
        :loading="generatingStatus[selectedService.name]"
        @click="onRefreshMetadata"
      />
    </div>
  </div>
</template>
