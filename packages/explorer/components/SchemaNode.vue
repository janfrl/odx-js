<script setup lang="ts">
import type { NodeProps } from '@vue-flow/core'
import { Handle, Position } from '@vue-flow/core'

interface EntityData {
  entity: {
    name: string
    properties: Array<{ name: string, type: string, isKey: boolean }>
  }
}

defineProps<NodeProps<EntityData>>()
</script>

<template>
  <div class="schema-node border border-neutral-200 dark:border-neutral-800 rounded-lg bg-white dark:bg-neutral-900 shadow-xl overflow-hidden min-w-45">
    <div class="px-3 py-2 bg-neutral-50 dark:bg-[#0a0a0a] border-b border-neutral-200 dark:border-neutral-800 flex items-center gap-2">
      <UIcon name="i-heroicons-table-cells" class="text-primary-500 w-3.5 h-3.5" />
      <span class="text-[11px] font-black tracking-wider text-neutral-900 dark:text-neutral-100">{{ data.entity.name }}</span>
    </div>

    <div class="py-1">
      <div
        v-for="prop in data.entity.properties"
        :key="prop.name"
        class="px-3 py-1 flex items-center justify-between gap-4 hover:bg-primary-500/5 group transition-colors"
      >
        <div class="flex items-center gap-1.5 overflow-hidden text-neutral-900 dark:text-neutral-100">
          <UIcon
            v-if="prop.isKey"
            name="i-heroicons-key"
            class="text-amber-500 w-2.5 h-2.5 shrink-0"
            title="Primary Key"
          />
          <div v-else class="w-2.5 h-2.5 shrink-0" />
          <span class="text-[10px] font-mono truncate opacity-90">{{ prop.name }}</span>
        </div>
        <span class="text-[9px] font-mono text-neutral-500 group-hover:text-primary-500 transition-colors italic">
          {{ prop.type.split('.').pop() }}
        </span>
      </div>
    </div>

    <Handle type="target" :position="Position.Left" class="!bg-primary-500 !w-2 !h-2" />
    <Handle type="source" :position="Position.Right" class="!bg-primary-500 !w-2 !h-2" />
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
