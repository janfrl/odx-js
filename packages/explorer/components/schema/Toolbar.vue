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
  <div class="flex flex-col shrink-0 bg-white dark:bg-zinc-950 rounded-t-[inherit] overflow-hidden">
    <!-- Toolbar Area -->
    <div class="px-4 py-3 border-b border-neutral-200/50 dark:border-neutral-800/50 flex items-center justify-between bg-white/80 dark:bg-neutral-900/40 backdrop-blur-md rounded-t-[inherit]">
      <div class="flex items-center gap-4">
        <div class="flex bg-neutral-100/50 dark:bg-neutral-800/50 p-0.5 rounded-lg border border-neutral-200/50 dark:border-neutral-700/50 items-center">
          <UButton
            label="ELK"
            :variant="layoutMode === 'elk' ? 'soft' : 'ghost'"
            :color="layoutMode === 'elk' ? 'primary' : 'neutral'"
            size="xs"
            class="font-bold px-3"
            @click="layoutMode = 'elk'"
          />
          <UButton
            label="Dagre (Tree)"
            :variant="layoutMode === 'hierarchical' ? 'soft' : 'ghost'"
            :color="layoutMode === 'hierarchical' ? 'primary' : 'neutral'"
            size="xs"
            class="font-bold px-3"
            @click="layoutMode = 'hierarchical'"
          />
          <UButton
            label="Dagre (Grid)"
            :variant="layoutMode === 'compact' ? 'soft' : 'ghost'"
            :color="layoutMode === 'compact' ? 'primary' : 'neutral'"
            size="xs"
            class="font-bold px-3"
            @click="layoutMode = 'compact'"
          />
        </div>

        <div v-if="loading" class="animate-pulse text-[10px] text-neutral-400 font-bold uppercase tracking-[0.2em] ml-2">
          Refining Schema...
        </div>
      </div>

      <div class="flex items-center gap-2">
        <UButton
          label="Auto Layout"
          icon="i-heroicons-arrow-path"
          color="neutral"
          variant="ghost"
          size="sm"
          class="font-bold"
          @click="fetchSchema(true)"
        />
        <UButton
          label="Reset"
          icon="i-heroicons-arrow-path-rounded-square"
          color="error"
          variant="ghost"
          size="sm"
          class="font-bold opacity-70 hover:opacity-100"
          @click="resetGraph"
        />
        <USeparator orientation="vertical" class="h-4 mx-2" />
        <UButton
          label="Mermaid"
          icon="i-heroicons-clipboard-document"
          color="neutral"
          variant="ghost"
          size="sm"
          class="font-bold"
          @click="copyMermaid"
        />
      </div>
    </div>
  </div>
</template>
