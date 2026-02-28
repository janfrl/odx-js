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
  copyMermaid,
  loading,
} = useSchemaExplorer()
</script>

<template>
  <div class="absolute inset-0 pointer-events-none z-50">
    <!-- Top Right: Export Actions -->
    <div class="absolute top-6 right-6 pointer-events-auto">
      <div class="flex flex-col bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm shadow-sm border border-neutral-200/50 dark:border-neutral-800/50 rounded-lg overflow-hidden">
        <UButton
          icon="i-heroicons-clipboard-document"
          color="neutral"
          variant="ghost"
          class="w-9 h-9 flex items-center justify-center rounded-none opacity-70 hover:opacity-100 transition-opacity"
          title="Copy Mermaid Diagram"
          @click="copyMermaid"
        />
      </div>
    </div>

    <!-- Bottom Right: View & Layout Controls -->
    <div class="absolute bottom-6 right-6 pointer-events-auto flex flex-col gap-3">
      <!-- Layout Calculation -->
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
      </div>

      <!-- Navigation -->
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

      <!-- View Modes -->
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
  </div>
</template>
