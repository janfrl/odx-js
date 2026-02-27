<script setup lang="ts">
import { useVueFlow } from '@vue-flow/core'
import { useSchemaExplorer } from '../../composables/useSchemaExplorer'

const {
  zoomIn,
  zoomOut,
} = useVueFlow()

const {
  isFullscreen,
  toggleFullscreen,
  fitToScreen,
  fetchSchema,
  resetGraph,
  copyMermaid,
  loading
} = useSchemaExplorer()
</script>

<template>
  <div class="absolute bottom-6 right-6 z-50 flex flex-col gap-3">
    <!-- Main Actions -->
    <div class="flex flex-col bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm shadow-sm border border-neutral-200/50 dark:border-neutral-800/50 rounded-lg overflow-hidden">
      <UButton
        icon="i-heroicons-arrow-path"
        color="neutral"
        variant="ghost"
        class="w-9 h-9 flex items-center justify-center rounded-none opacity-70 hover:opacity-100 transition-opacity"
        :loading="loading"
        title="Auto Layout"
        @click="fetchSchema(true)"
      />
      <div class="h-px bg-neutral-200/50 dark:bg-neutral-800/50" />
      <UButton
        icon="i-heroicons-arrow-path-rounded-square"
        color="error"
        variant="ghost"
        class="w-9 h-9 flex items-center justify-center rounded-none opacity-50 hover:opacity-100 transition-opacity"
        title="Reset Graph"
        @click="resetGraph"
      />
      <div class="h-px bg-neutral-200/50 dark:bg-neutral-800/50" />
      <UButton
        icon="i-heroicons-clipboard-document"
        color="neutral"
        variant="ghost"
        class="w-9 h-9 flex items-center justify-center rounded-none opacity-70 hover:opacity-100 transition-opacity"
        title="Copy Mermaid Diagram"
        @click="copyMermaid"
      />
    </div>

    <!-- View Controls -->
    <div class="flex flex-col bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm shadow-sm border border-neutral-200/50 dark:border-neutral-800/50 rounded-lg overflow-hidden">
      <UButton
        icon="i-heroicons-plus"
        color="neutral"
        variant="ghost"
        class="w-9 h-9 flex items-center justify-center rounded-none opacity-70 hover:opacity-100 transition-opacity"
        title="Zoom In (+)"
        @click="zoomIn()"
      />
      <div class="h-px bg-neutral-200/50 dark:bg-neutral-800/50" />
      <UButton
        icon="i-heroicons-minus"
        color="neutral"
        variant="ghost"
        class="w-9 h-9 flex items-center justify-center rounded-none opacity-70 hover:opacity-100 transition-opacity"
        title="Zoom Out (-)"
        @click="zoomOut()"
      />
    </div>

    <div class="flex flex-col bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm shadow-sm border border-neutral-200/50 dark:border-neutral-800/50 rounded-lg overflow-hidden">
      <UButton
        icon="i-heroicons-arrows-pointing-in"
        color="neutral"
        variant="ghost"
        class="w-9 h-9 flex items-center justify-center rounded-none opacity-70 hover:opacity-100 transition-opacity"
        title="Fit to Screen (R)"
        @click="fitToScreen"
      />
      <div class="h-px bg-neutral-200/50 dark:bg-neutral-800/50" />
      <UButton
        :icon="isFullscreen ? 'i-heroicons-arrows-pointing-in' : 'i-heroicons-arrows-pointing-out'"
        color="neutral"
        variant="ghost"
        class="w-9 h-9 flex items-center justify-center rounded-none opacity-70 hover:opacity-100 transition-opacity"
        :title="isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'"
        @click="toggleFullscreen"
      />
    </div>
  </div>
</template>
