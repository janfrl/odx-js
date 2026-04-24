<script setup lang="ts">
const route = useRoute()
const localePrefix = computed(() => route.path.startsWith('/de') ? '/de' : '/en')

const packages = computed(() => [
  {
    title: 'Core',
    description: 'Framework-agnostic OData types, URL builder, and lightweight fetch client.',
    icon: 'i-lucide-code-2',
    to: `${localePrefix.value}/core/installation`,
  },
  {
    title: 'Proxy',
    description: 'Nitro proxy for SAP BTP destinations, CSRF preflight, auth-heavy routing, and backend isolation.',
    icon: 'i-lucide-cable',
    to: `${localePrefix.value}/proxy/installation`,
  },
  {
    title: 'Nuxt',
    description: 'Nuxt module with service registration, auto-imported clients, generated types, and SSR-safe querying.',
    icon: 'i-simple-icons-nuxtdotjs',
    to: `${localePrefix.value}/nuxt/getting-started`,
  },
  {
    title: 'Explorer',
    description: 'DevTools surface for schema inspection, request visibility, and service-level debugging.',
    icon: 'i-lucide-monitor',
    to: `${localePrefix.value}/explorer/setup`,
  },
])
</script>

<template>
  <UPageSection
    id="packages"
    headline="Packages"
    title="Modular by design"
    description="Use the full ODX stack or pick the package that matches your integration boundary."
    orientation="vertical"
    :ui="{ container: 'py-16 lg:py-20' }"
  >
    <UPageGrid class="sm:grid-cols-2 lg:grid-cols-4">
      <UPageCard
        v-for="pkg in packages"
        :key="pkg.title"
        v-bind="pkg"
        variant="subtle"
      />
    </UPageGrid>
  </UPageSection>
</template>
