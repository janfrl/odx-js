<script setup lang="ts">
const features = [
  {
    title: 'Typed from metadata',
    description: 'Generate models, entity sets, and query helpers directly from EDMX instead of maintaining client types by hand.',
    icon: 'i-lucide-braces',
  },
  {
    title: 'SAP-ready access',
    description: 'Route through a Nitro proxy for destinations, auth-heavy services, CSRF handling, and backend isolation.',
    icon: 'i-simple-icons-sap',
  },
  {
    title: 'Visible while developing',
    description: 'Inspect schemas, relationships, requests, responses, and proxy behavior without leaving the Nuxt workflow.',
    icon: 'i-lucide-activity',
  },
]
</script>

<template>
  <UPageSection
    id="features"
    headline="Why ODX"
    title="A shorter path from service metadata to working UI"
    description="The toolkit keeps the repetitive OData work close to the framework and visible during development."
    orientation="vertical"
    :ui="{ container: 'py-12 lg:py-16' }"
  >
    <UPageGrid class="lg:grid-cols-3">
      <UPageCard
        v-for="feature in features"
        :key="feature.title"
        v-bind="feature"
        variant="subtle"
      />
    </UPageGrid>
  </UPageSection>
</template>
