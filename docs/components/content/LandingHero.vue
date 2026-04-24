<script setup lang="ts">
const route = useRoute()
const localePrefix = computed(() => route.path.startsWith('/de') ? '/de' : '/en')

const links = computed(() => [
  {
    label: 'Get started',
    to: `${localePrefix.value}/ecosystem/introduction`,
    trailingIcon: 'i-lucide-arrow-right',
  },
  {
    label: 'GitHub',
    to: 'https://github.com/janfrl/odx-js',
    target: '_blank',
    color: 'neutral' as const,
    variant: 'subtle' as const,
    icon: 'i-simple-icons-github',
  },
])

const flow = [
  {
    label: 'Metadata',
    description: 'Read EDMX from SAP, public OData, or mocks',
    icon: 'i-lucide-file-code-2',
  },
  {
    label: 'Types',
    description: 'Generate entities, collections, and navigation properties',
    icon: 'i-lucide-braces',
  },
  {
    label: 'Runtime',
    description: 'Query through Nuxt composables or the proxy layer',
    icon: 'i-lucide-route',
  },
]
</script>

<template>
  <UPageHero
    headline="OData Developer Experience"
    title="Modern OData for Nuxt, TypeScript, and SAP"
    description="ODX is a modular toolkit for OData V2 and V4 services with typed clients, a Nuxt module, proxy support, and an Explorer for DevTools workflows."
    orientation="horizontal"
    :links="links"
    :ui="{ container: 'py-20 sm:py-24 lg:py-28' }"
  >
    <template #headline>
      <ULink
        :to="`${localePrefix}/ecosystem/introduction`"
      >
        <UBadge
          color="primary"
          variant="subtle"
          size="lg"
          trailing-icon="i-lucide-arrow-right"
        >
          Explorer 0.4: schema graph and live proxy tap
        </UBadge>
      </ULink>
    </template>

    <UPageCard
      title="Typed OData loop"
      description="One flow from service metadata to editor-aware queries."
      icon="i-lucide-workflow"
      variant="subtle"
      spotlight
    >
      <div class="grid gap-3">
        <div
          v-for="item in flow"
          :key="item.label"
          class="flex gap-3 rounded-lg bg-elevated/50 p-3 ring ring-default"
        >
          <UIcon :name="item.icon" class="mt-0.5 size-5 shrink-0 text-primary" />
          <div class="min-w-0">
            <div class="font-medium text-highlighted">
              {{ item.label }}
            </div>
            <p class="mt-1 text-sm text-muted">
              {{ item.description }}
            </p>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex flex-wrap gap-2">
          <UBadge color="neutral" variant="subtle">
            OData V2/V4
          </UBadge>
          <UBadge color="neutral" variant="subtle">
            SAP BTP
          </UBadge>
          <UBadge color="neutral" variant="subtle">
            Nuxt module
          </UBadge>
        </div>
      </template>
    </UPageCard>
  </UPageHero>
</template>
