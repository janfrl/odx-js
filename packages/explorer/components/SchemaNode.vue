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
    return 'i-lucide-user'
  if (name.includes('order') || name.includes('sale') || name.includes('purchase') || name.includes('cart'))
    return 'i-lucide-shopping-cart'
  if (name.includes('product') || name.includes('item') || name.includes('material'))
    return 'i-lucide-box'
  if (name.includes('invoice') || name.includes('bill') || name.includes('document'))
    return 'i-lucide-file-text'
  if (name.includes('payment') || name.includes('money') || name.includes('price'))
    return 'i-lucide-banknote'
  if (name.includes('address') || name.includes('location') || name.includes('site') || name.includes('warehouse'))
    return 'i-lucide-map-pin'
  if (name.includes('category') || name.includes('tag') || name.includes('group'))
    return 'i-lucide-tag'
  if (name.includes('config') || name.includes('setting') || name.includes('parameter'))
    return 'i-lucide-settings'
  if (name.includes('log') || name.includes('history') || name.includes('audit'))
    return 'i-lucide-clipboard-list'
  if (name.includes('date') || name.includes('time') || name.includes('event') || name.includes('schedule'))
    return 'i-lucide-calendar'
  if (name.includes('file') || name.includes('attachment') || name.includes('image'))
    return 'i-lucide-paperclip'
  if (name.includes('message') || name.includes('chat') || name.includes('mail'))
    return 'i-lucide-mail'

  return 'i-lucide-database'
})
</script>

<template>
  <div class="schema-node border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 shadow-xl ring-1 ring-neutral-200 dark:ring-neutral-700 overflow-hidden min-w-48 transition-all duration-200">
    <!-- Header (Solid Zone) -->
    <div class="px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 flex items-center gap-2.5">
      <UIcon :name="entityIcon" class="text-neutral-500 dark:text-neutral-400 w-4 h-4" />
      <span class="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
        {{ data.entity.name }}
      </span>
    </div>

    <!-- Body (Solid Zone) -->
    <div class="py-1.5 bg-white dark:bg-neutral-900">
      <div
        v-for="prop in data.entity.properties"
        :key="prop.name"
        class="px-3.5 py-1 flex items-center justify-between gap-4 hover:bg-neutral-50 dark:hover:bg-neutral-800 group transition-colors"
      >
        <div class="flex items-center gap-2 overflow-hidden">
          <UIcon
            v-if="prop.isKey"
            name="i-lucide-key"
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

    <!-- Hidden Handles for connection anchors -->
    <Handle type="target" :position="Position.Left" class="opacity-0! pointer-events-none!" />
    <Handle type="source" :position="Position.Right" class="opacity-0! pointer-events-none!" />
  </div>
</template>

<style scoped>
/* Scoped styles removed in favor of Tailwind classes for consistency */
</style>
