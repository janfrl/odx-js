<script setup lang="ts">
const route = useRoute()
const localePrefix = computed(() => route.path.startsWith('/de') ? '/de' : '/en')

const paths = computed(() => [
  {
    title: 'Build a Nuxt app',
    description: 'Start here when you want auto-imported clients, SSR-safe queries, generated types, and DevTools integration.',
    icon: 'i-simple-icons-nuxtdotjs',
    to: `${localePrefix.value}/nuxt/getting-started`,
  },
  {
    title: 'Connect to SAP safely',
    description: 'Use the proxy when your service needs BTP destinations, NetWeaver routing, CSRF handling, or backend isolation.',
    icon: 'i-simple-icons-sap',
    to: `${localePrefix.value}/proxy/installation`,
  },
  {
    title: 'Use OData without Nuxt',
    description: 'Reach for Core when you need typed OData models, query helpers, and a lightweight client in any TypeScript runtime.',
    icon: 'i-lucide-code-2',
    to: `${localePrefix.value}/core/installation`,
  },
  {
    title: 'Inspect and debug services',
    description: 'Open Explorer when you need to understand entity sets, relationships, metadata, requests, and proxy behavior.',
    icon: 'i-lucide-activity',
    to: `${localePrefix.value}/explorer/setup`,
  },
])
</script>

<template>
  <UPageSection
    id="paths"
    headline="Choose your path"
    title="Start where your integration starts"
    description="ODX is split by workflow, so you can go straight to the package and guide that match the problem in front of you."
    orientation="vertical"
    :ui="{ container: 'py-16 lg:py-20' }"
  >
    <UPageGrid class="sm:grid-cols-2 lg:grid-cols-4">
      <UPageCard
        v-for="path in paths"
        :key="path.title"
        v-bind="path"
        variant="subtle"
        spotlight
      />
    </UPageGrid>
  </UPageSection>
</template>
