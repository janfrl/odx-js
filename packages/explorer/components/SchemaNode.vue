<script setup lang="ts">
import type { NodeProps } from '@vue-flow/core'
import { Handle, Position } from '@vue-flow/core'
import { computed } from 'vue'

interface EntityData {
  entity: {
    name: string
    properties: Array<{ name: string, type: string, isKey: boolean }>
  }
}

const props = defineProps<NodeProps<EntityData>>()

const entityIcon = computed(() => {
  const name = props.data.entity.name.toLowerCase()
  if (name.includes('user') || name.includes('person') || name.includes('contact') || name.includes('customer') || name.includes('supplier'))
    return 'i-heroicons-user'
  if (name.includes('order') || name.includes('sale') || name.includes('purchase') || name.includes('cart'))
    return 'i-heroicons-shopping-cart'
  if (name.includes('product') || name.includes('item') || name.includes('material'))
    return 'i-heroicons-cube'
  if (name.includes('invoice') || name.includes('bill') || name.includes('document'))
    return 'i-heroicons-document-text'
  if (name.includes('payment') || name.includes('money') || name.includes('price'))
    return 'i-heroicons-banknotes'
  if (name.includes('address') || name.includes('location') || name.includes('site') || name.includes('warehouse'))
    return 'i-heroicons-map-pin'
  if (name.includes('category') || name.includes('tag') || name.includes('group'))
    return 'i-heroicons-tag'
  if (name.includes('config') || name.includes('setting') || name.includes('parameter'))
    return 'i-heroicons-cog-6-tooth'
  if (name.includes('log') || name.includes('history') || name.includes('audit'))
    return 'i-heroicons-clipboard-document-list'
  if (name.includes('date') || name.includes('time') || name.includes('event') || name.includes('schedule'))
    return 'i-heroicons-calendar'
  if (name.includes('file') || name.includes('attachment') || name.includes('image'))
    return 'i-heroicons-paper-clip'
  if (name.includes('message') || name.includes('chat') || name.includes('mail'))
    return 'i-heroicons-envelope'

  return 'i-heroicons-circle-stack'
})
</script>

<template>
  <div class="schema-node border border-neutral-200/80 dark:border-neutral-800/80 rounded-lg bg-white dark:bg-neutral-900 shadow-sm hover:shadow-md hover:border-neutral-300 dark:hover:border-neutral-700 hover:ring-1 hover:ring-neutral-200 dark:hover:ring-neutral-800 overflow-hidden min-w-48 transition-all duration-200">
    <!-- Header -->
    <div class="px-3.5 py-2.5 bg-neutral-50/50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800 flex items-center gap-2.5">
      <UIcon :name="entityIcon" class="text-neutral-500 dark:text-neutral-400 w-4 h-4" />
      <span class="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
        {{ data.entity.name }}
      </span>
    </div>

    <!-- Properties -->
    <div class="py-1.5">
      <div
        v-for="prop in data.entity.properties"
        :key="prop.name"
        class="px-3.5 py-1 flex items-center justify-between gap-4 hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50 group transition-colors"
      >
        <div class="flex items-center gap-2 overflow-hidden">
          <UIcon
            v-if="prop.isKey"
            name="i-heroicons-key"
            class="text-amber-500 w-3 h-3 shrink-0"
            title="Primary Key"
          />
          <div v-else class="w-3" />
          <span class="text-[11px] font-mono truncate text-neutral-600 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">
            {{ prop.name }}
          </span>
        </div>
        <span class="text-[10px] font-mono text-neutral-400 dark:text-neutral-500 italic shrink-0 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors">
          {{ prop.type.split('.').pop() }}
        </span>
      </div>
    </div>

    <!-- Handles -->
    <Handle type="target" :position="Position.Left" class="bg-neutral-400! border-white! dark:border-neutral-900! w-2.5! h-2.5!" />
    <Handle type="source" :position="Position.Right" class="bg-neutral-400! border-white! dark:border-neutral-900! w-2.5! h-2.5!" />
  </div>
</template>

<style scoped>
/* Scoped styles removed in favor of Tailwind classes for consistency */
</style>
