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
  resetGraph,
  copyMermaid,
  loading,
} = useSchemaExplorer()
</script>

<template>
  <div class="absolute inset-0 pointer-events-none z-50">
    <!-- Top Right: Export Actions -->
    <div class="absolute top-6 right-6 pointer-events-auto">
      <div class="flex flex-col bg-white dark:bg-neutral-900 shadow-lg ring-1 ring-neutral-200 dark:ring-neutral-700 rounded-lg overflow-hidden">
        <UButton
          icon="i-lucide-clipboard"
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
      <div class="flex flex-col bg-white dark:bg-neutral-900 shadow-lg ring-1 ring-neutral-200 dark:ring-neutral-700 rounded-lg overflow-hidden">
        <UButton
          icon="i-lucide-rotate-ccw"
          color="neutral"
          variant="ghost"
          class="w-9 h-9 flex items-center justify-center rounded-none opacity-70 hover:opacity-100 transition-opacity"
          :loading="loading"
          title="Auto Layout (Shift+R)"
          @click="resetGraph"
        />
      </div>

      <!-- Navigation -->
      <div class="flex flex-col bg-white dark:bg-neutral-900 shadow-lg ring-1 ring-neutral-200 dark:ring-neutral-700 rounded-lg overflow-hidden">
        <UButton
          icon="i-lucide-plus"
          color="neutral"
          variant="ghost"
          class="w-9 h-9 flex items-center justify-center rounded-none opacity-70 hover:opacity-100 transition-opacity"
          title="Zoom In (+)"
          @click="zoomIn()"
        />
        <div class="h-px bg-neutral-200/50 dark:bg-neutral-800/50" />
        <UButton
          icon="i-lucide-minus"
          color="neutral"
          variant="ghost"
          class="w-9 h-9 flex items-center justify-center rounded-none opacity-70 hover:opacity-100 transition-opacity"
          title="Zoom Out (-)"
          @click="zoomOut()"
        />
      </div>

      <!-- View Modes -->
      <div class="flex flex-col bg-white dark:bg-neutral-900 shadow-lg ring-1 ring-neutral-200 dark:ring-neutral-700 rounded-lg overflow-hidden">
        <UButton
          icon="i-lucide-focus"
          color="neutral"
          variant="ghost"
          class="w-9 h-9 flex items-center justify-center rounded-none opacity-70 hover:opacity-100 transition-opacity"
          title="Fit to Screen (R)"
          @click="fitToScreen"
        />
        <div class="h-px bg-neutral-200/50 dark:bg-neutral-800/50" />
        <UButton
          :icon="isFullscreen ? 'i-lucide-minimize' : 'i-lucide-maximize'"
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
