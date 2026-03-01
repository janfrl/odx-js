<script setup lang="ts">
import { useEntityExplorer } from '../../composables/useEntityExplorer'

const {
  queryInput,
  refreshEntityData,
  previewData,
  openEditor,
  downloadJson,
  clearData,
} = useEntityExplorer()
</script>

<template>
  <div class="flex flex-col shrink-0 bg-white dark:bg-zinc-950 rounded-t-[inherit] overflow-hidden">
    <!-- Query Area -->
    <div class="p-4 border-b border-neutral-200/50 dark:border-neutral-800/50 flex items-center gap-4 bg-white/80 dark:bg-neutral-900/40 backdrop-blur-md rounded-t-[inherit]">
      <UInput
        v-model="queryInput"
        placeholder="?id=... or ?$filter=..."
        icon="i-lucide-search"
        class="flex-1 font-mono"
        size="md"
        @keyup.enter="refreshEntityData"
      >
        <template #trailing>
          <UKbd>Enter</UKbd>
        </template>
      </UInput>
      <UButton
        label="Execute"
        icon="i-lucide-play"
        color="primary"
        size="md"
        class="px-4 font-bold"
        @click="refreshEntityData"
      />
    </div>

    <!-- Actions Area -->
    <div class="px-6 py-2 border-b border-neutral-200/50 dark:border-neutral-800/50 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-900/20">
      <div class="flex items-center gap-4">
        <span class="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">
          {{ previewData.length }} Results
        </span>
        <USeparator orientation="vertical" class="h-4" />
        <div class="flex items-center gap-2">
          <UButton label="Headers" icon="i-lucide-sliders-horizontal" variant="ghost" color="neutral" size="sm" @click="openEditor('headers')" />
          <template v-if="previewData.length > 0">
            <UButton label="JSON" icon="i-lucide-download" variant="ghost" color="neutral" size="sm" @click="downloadJson" />
            <UButton label="Clear" icon="i-lucide-trash-2" variant="ghost" color="error" size="sm" @click="clearData" />
          </template>
        </div>
      </div>
      <UButton
        label="New Record"
        icon="i-lucide-plus"
        variant="outline"
        color="neutral"
        size="sm"
        class="font-bold px-4"
        @click="openEditor('create')"
      />
    </div>
  </div>
</template>
