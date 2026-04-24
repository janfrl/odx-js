<script setup lang="ts">
import type { VNode } from 'vue'

const slots = useSlots()

function flatten(nodes: VNode[] = []): VNode[] {
  return nodes.flatMap((node) => {
    return Array.isArray(node.children) ? flatten(node.children as VNode[]) : node
  })
}

const items = computed(() => {
  return flatten(slots.code?.() ?? [])
    .filter(node => typeof node.type !== 'symbol')
    .map((node, index) => ({
      label: String(node.props?.filename || node.props?.label || index),
      icon: node.props?.icon,
      component: node,
    }))
})
</script>

<template>
  <UPageSection
    id="demo"
    headline="Live demo"
    title="Query any OData service like a local object"
    description="Point ODX at a metadata URL and the SDK generates typed collections, entities, and navigation properties for your Nuxt app."
    orientation="vertical"
    :ui="{ container: 'py-16 lg:py-20' }"
  >
    <div class="grid items-start gap-6 lg:h-[450px] lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
      <ProseCodeTree
        :items="items"
        default-value="composables/products.ts"
        expand-all
        class="!my-0 h-full"
      />

      <div class="min-h-0 lg:h-full [&_.relative.group]:!my-0 [&_.relative.group]:h-full [&_.relative.group]:min-h-0 [&_.relative.group]:flex [&_.relative.group]:flex-col [&_.prose-pre]:!my-0 [&_.prose-pre]:min-h-0 [&_.prose-pre]:flex-1 [&_.prose-pre]:overflow-auto">
        <slot name="response" />
      </div>
    </div>
  </UPageSection>
</template>
