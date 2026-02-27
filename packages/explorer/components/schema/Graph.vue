<script setup lang="ts">
import { Background } from '@vue-flow/background'
import { VueFlow } from '@vue-flow/core'
import { useSchemaExplorer } from '../../composables/useSchemaExplorer'

const {
  globalNodes,
  globalEdges,
  nodeTypes,
  containerRef,
  isReady,
} = useSchemaExplorer()
</script>

<template>
  <div class="flex-1 relative bg-transparent h-full">
    <div
      ref="containerRef"
      class="absolute inset-0 transition-opacity duration-500 bg-white dark:bg-neutral-900/50"
      :class="{ 'opacity-0': !isReady, 'opacity-100': isReady }"
    >
      <VueFlow
        v-model:nodes="globalNodes"
        v-model:edges="globalEdges"
        :node-types="nodeTypes"
        :min-zoom="0.05"
        :max-zoom="4"
        class="h-full w-full"
      >
        <Background pattern-color="#888" :gap="20" />
        <slot />
      </VueFlow>
    </div>
  </div>
</template>

<style>
.vue-flow__edge-path {
  stroke-dasharray: 5;
  stroke-dashoffset: 10;
  animation: dashdraw 0.5s linear infinite;
}

@keyframes dashdraw {
  from { stroke-dashoffset: 10; }
  to { stroke-dashoffset: 0; }
}

.vue-flow__edge-label {
  background: white;
  color: #525252;
  padding: 3px 8px;
  border-radius: 4px;
  font-weight: 500;
  font-size: 11px;
  border: 1px solid #e5e5e5;
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
}

.dark .vue-flow__edge-label {
  background: #171717;
  color: #a3a3a3;
  border-color: #404040;
}

.vue-flow__edge-textbg {
  fill: white;
  fill-opacity: 1;
}

.dark .vue-flow__edge-textbg {
  fill: #171717;
}

.vue-flow__edge-text {
  fill: #525252;
  font-weight: 500;
  font-size: 11px;
}

.dark .vue-flow__edge-text {
  fill: #a3a3a3;
}
.vue-flow__controls { display: none; }

.vue-flow {
  background-color: transparent !important;
}
</style>
