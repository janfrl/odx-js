<script setup lang="ts">
const pipeline = [
  {
    title: 'Nuxt app',
    description: 'Your component calls typed composables and generated entity clients.',
    icon: 'i-simple-icons-nuxtdotjs',
  },
  {
    title: 'ODX runtime',
    description: 'The SDK composes OData URLs, applies query helpers, and parses schema-aware responses.',
    icon: 'i-lucide-box',
  },
  {
    title: 'Proxy layer',
    description: 'Nitro handles SAP auth, CSRF preflight, destinations, and backend routing when needed.',
    icon: 'i-lucide-cable',
  },
  {
    title: 'OData backend',
    description: 'SAP Gateway, public OData services, or local mocks return the data your app expects.',
    icon: 'i-lucide-database',
  },
]
</script>

<template>
  <UPageSection
    id="architecture"
    headline="Architecture"
    title="One pipeline, end-to-end typed"
    description="ODX keeps the moving parts explicit: app code, generated types, runtime query building, optional proxy behavior, and the target OData service."
    orientation="vertical"
    :ui="{ container: 'py-16 lg:py-20' }"
  >
    <UPageGrid class="lg:grid-cols-4">
      <UPageCard
        v-for="(item, index) in pipeline"
        :key="item.title"
        v-bind="item"
        variant="outline"
      >
        <template #footer>
          <div class="flex items-center gap-2 text-sm text-muted">
            <UBadge color="neutral" variant="subtle">
              {{ index + 1 }}
            </UBadge>
            <UIcon
              v-if="index < pipeline.length - 1"
              name="i-lucide-arrow-right"
              class="size-4 text-primary"
            />
          </div>
        </template>
      </UPageCard>
    </UPageGrid>
  </UPageSection>
</template>
