<script setup lang="ts">
import { useVueFlow } from '@vue-flow/core'
import { useEventListener } from '@vueuse/core'
import { useSchemaExplorer } from '../../composables/useSchemaExplorer'

const { zoomIn, zoomOut, fitView } = useVueFlow()
const { toggleFullscreen, resetGraph } = useSchemaExplorer()

useEventListener('keydown', (e: KeyboardEvent) => {
  const isInput = ['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)
  if (isInput) {
    return
  }

  if (e.key === 'f' || e.key === 'F') {
    toggleFullscreen()
  }
  if (e.key === 'R' && e.shiftKey) {
    resetGraph()
  }
  else if (e.key === 'r' || e.key === 'R') {
    fitView({ padding: 0.2, duration: 400 })
  }
  if (e.key === '+' || e.key === '=') {
    zoomIn()
  }
  if (e.key === '-') {
    zoomOut()
  }
})
</script>

<template>
  <div v-if="false" />
</template>
