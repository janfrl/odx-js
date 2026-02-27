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
} = useSchemaExplorer()
</script>

<template>
  <div class="absolute bottom-6 right-6 z-50 flex flex-col gap-3">
    <div class="flex flex-col bg-white/75 dark:bg-neutral-900/75 backdrop-blur shadow-sm ring-1 ring-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden text-neutral-900 dark:text-white">
      <UButton
        icon="i-heroicons-plus"
        color="neutral"
        variant="ghost"
        class="w-10 h-10 flex items-center justify-center rounded-none"
        title="Zoom In (+)"
        @click="zoomIn()"
      />
      <div class="h-px bg-neutral-200 dark:bg-neutral-800" />
      <UButton
        icon="i-heroicons-minus"
        color="neutral"
        variant="ghost"
        class="w-10 h-10 flex items-center justify-center rounded-none"
        title="Zoom Out (-)"
        @click="zoomOut()"
      />
    </div>
    <div class="flex flex-col bg-white/75 dark:bg-neutral-900/75 backdrop-blur shadow-sm ring-1 ring-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden text-neutral-900 dark:text-white">
      <UButton
        icon="i-heroicons-arrows-pointing-in"
        color="neutral"
        variant="ghost"
        class="w-10 h-10 flex items-center justify-center rounded-none"
        title="Fit to Screen (R)"
        @click="fitToScreen"
      />
      <div class="h-px bg-neutral-200 dark:bg-neutral-800" />
      <UButton
        :icon="isFullscreen ? 'i-heroicons-arrows-pointing-in' : 'i-heroicons-arrows-pointing-out'"
        color="neutral"
        variant="ghost"
        class="w-10 h-10 flex items-center justify-center rounded-none"
        :title="isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'"
        @click="toggleFullscreen"
      />
    </div>
  </div>
</template>
