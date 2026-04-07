<script setup lang="ts">
import { useSharedODataState } from '../../composables/useODataState'

const { selectedService, generatingStatus, generateService } = useSharedODataState()
const toast = useToast()

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
</script>

<template>
  <div
    class="flex-1 flex flex-col items-center justify-center text-center p-12 bg-error-50/5 dark:bg-error-900/5 border-2 border-dashed border-error-500/30 rounded-t-2xl transition-all"
  >
    <div class="w-16 h-16 rounded-2xl bg-error-100 dark:bg-error-900/20 border border-error-500/50 flex items-center justify-center mb-6 shadow-sm">
      <UIcon name="i-lucide-circle-off" class="text-error-500 w-8 h-8" />
    </div>
    <h3 class="text-sm font-bold uppercase tracking-widest mb-2 text-default">
      Service Unreachable
    </h3>
    <p class="text-[12px] text-muted max-w-70 leading-relaxed mb-6">
      The OData service at this endpoint is currently not responding. This might be due to network restrictions (VPN), a server-side issue, or an invalid URL.
    </p>

    <div class="flex items-center gap-3">
      <UButton
        v-if="selectedService"
        icon="i-lucide-refresh-cw"
        color="neutral"
        variant="subtle"
        label="Regenerate SDK"
        :loading="generatingStatus[selectedService.name]"
        @click="onRegenerate"
      />
    </div>
  </div>
</template>
