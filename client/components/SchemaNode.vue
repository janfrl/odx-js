<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import type { NodeProps } from '@vue-flow/core'

interface EntityData {
  entity: {
    name: string
    properties: Array<{ name: string, type: string, isKey: boolean }>
  }
}

defineProps<NodeProps<EntityData>>()
</script>

<template>
  <div class="schema-node border border-base rounded-lg bg-content shadow-xl overflow-hidden min-w-[180px]">
    <!-- Header: Matches Data Table Header color -->
    <div class="px-3 py-2 bg-zinc-100 dark:bg-zinc-900 border-b border-base flex items-center gap-2">
      <div class="i-carbon-table text-primary w-3.5 h-3.5" />
      <span class="text-[11px] font-black uppercase tracking-wider text-base">{{ data.entity.name }}</span>
    </div>

    <!-- Properties -->
    <div class="py-1">
      <div
        v-for="prop in data.entity.properties"
        :key="prop.name"
        class="px-3 py-1 flex items-center justify-between gap-4 hover:bg-primary/5 group transition-colors"
      >
        <div class="flex items-center gap-1.5 overflow-hidden">
          <div
            v-if="prop.isKey"
            class="i-carbon-key text-amber-500 w-2.5 h-2.5 shrink-0"
            title="Primary Key"
          />
          <div v-else class="w-2.5 h-2.5 shrink-0" />
          <span class="text-[10px] font-mono truncate text-base opacity-90">{{ prop.name }}</span>
        </div>
        <span class="text-[9px] font-mono text-muted group-hover:text-primary transition-colors italic">
          {{ prop.type.split('.').pop() }}
        </span>
      </div>
    </div>

    <!-- Handles for connections -->
    <Handle type="target" :position="Position.Left" class="!bg-primary !w-2 !h-2" />
    <Handle type="source" :position="Position.Right" class="!bg-primary !w-2 !h-2" />
  </div>
</template>

<style scoped>
.schema-node {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.schema-node:hover {
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
}
</style>
