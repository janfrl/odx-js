<script setup lang="ts">
const features = [
  {
    title: 'Universal compatibility',
    description: 'Works with compliant OData V2 and V4 endpoints, from public services to enterprise SAP landscapes.',
    icon: 'i-lucide-globe',
  },
  {
    title: 'First-class SAP support',
    description: 'Handles NetWeaver routing, CSRF token prefetching, and BTP destination authentication through the proxy layer.',
    icon: 'i-simple-icons-sap',
  },
  {
    title: 'Type-safe SDK',
    description: 'Generates TypeScript models from EDMX so entity fields, navigation properties, and query operators are known by your editor.',
    icon: 'i-lucide-shield-check',
  },
  {
    title: 'Schema Explorer',
    description: 'Inspect entity sets, relationships, metadata, and service shape from a Nuxt DevTools experience.',
    icon: 'i-lucide-share-2',
  },
  {
    title: 'Request introspection',
    description: 'Follow OData requests, responses, metadata fetches, and proxy behavior while developing.',
    icon: 'i-lucide-activity',
  },
  {
    title: 'Mock-friendly development',
    description: 'Build UI against local JSON and metadata fixtures before the target backend is ready.',
    icon: 'i-lucide-database',
  },
]
</script>

<template>
  <UPageSection
    id="features"
    headline="Features"
    title="Built for OData, shaped for Nuxt DX"
    description="The landing page now uses the same Nuxt UI page primitives as the rest of the docs: semantic colors, standard cards, and compact content."
    orientation="vertical"
    :ui="{ container: 'py-16 lg:py-20' }"
  >
    <UPageGrid>
      <UPageCard
        v-for="feature in features"
        :key="feature.title"
        v-bind="feature"
        variant="subtle"
      />
    </UPageGrid>
  </UPageSection>
</template>
