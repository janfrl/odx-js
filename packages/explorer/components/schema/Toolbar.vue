<script setup lang="ts">
import { useSchemaExplorer } from '../../composables/useSchemaExplorer'

const {
  layoutMode,
  loading,
  fetchSchema,
  resetGraph,
  copyMermaid,
} = useSchemaExplorer()
</script>

<template>
  <div class="shrink-0 flex flex-col bg-white dark:bg-neutral-900 rounded-t-[inherit] overflow-hidden">
    <div class="py-4 px-6 flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 shrink-0">
      <div class="flex items-center gap-6">
        <div class="flex bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg border border-neutral-200 dark:border-neutral-700 items-center">
          <UButton
            label="ELK"
            :variant="layoutMode === 'elk' ? 'solid' : 'ghost'"
            :color="layoutMode === 'elk' ? 'primary' : 'neutral'"
            size="xs"
            class="font-semibold px-3"
            @click="layoutMode = 'elk'"
          />
          <UButton
            label="Dagre (Tree)"
            :variant="layoutMode === 'hierarchical' ? 'solid' : 'ghost'"
            :color="layoutMode === 'hierarchical' ? 'primary' : 'neutral'"
            size="xs"
            class="font-semibold px-3"
            @click="layoutMode = 'hierarchical'"
          />
          <UButton
            label="Dagre (Grid)"
            :variant="layoutMode === 'compact' ? 'solid' : 'ghost'"
            :color="layoutMode === 'compact' ? 'primary' : 'neutral'"
            size="xs"
            class="font-semibold px-3"
            @click="layoutMode = 'compact'"
          />
        </div>

        <div v-if="loading" class="animate-pulse text-xs text-neutral-500 font-semibold uppercase tracking-wider ml-4">
          Refining Schema...
        </div>
      </div>

      <div class="flex items-center gap-2">
        <UButton
          label="Auto Layout"
          icon="i-heroicons-arrow-path"
          color="primary"
          variant="soft"
          size="sm"
          class="font-semibold"
          title="Recalculate positions"
          @click="fetchSchema(true)"
        />
        <UButton
          label="Reset"
          icon="i-heroicons-arrow-path-rounded-square"
          color="error"
          variant="ghost"
          size="sm"
          class="font-semibold"
          title="Clear manual work"
          @click="resetGraph"
        />
        <div class="w-px h-5 bg-neutral-200 dark:bg-neutral-800 mx-2" />
        <UButton
          label="Mermaid"
          icon="i-heroicons-clipboard-document"
          color="neutral"
          variant="ghost"
          size="sm"
          class="font-semibold"
          @click="copyMermaid"
        />
      </div>
    </div>
  </div>
</template>
