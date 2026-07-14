<script setup lang="ts">
const steps = [
  {
    title: 'Install the Nuxt module',
    description: 'Add the package and let it wire DevTools, types, composables, and proxy support.',
    icon: 'i-lucide-package-plus',
    code: `
\`\`\`bash [terminal]
pnpm add -D @me-tools/odx-nuxt
\`\`\`
`,
  },
  {
    title: 'Declare your service',
    description: 'Register an OData endpoint in your Nuxt config and ODX discovers the schema.',
    icon: 'i-lucide-settings-2',
    code: `
\`\`\`ts [nuxt.config.ts] {3-11}
export default defineNuxtConfig({
  modules: ['@me-tools/odx-nuxt'],
  odx: {
    services: {
      sap: {
        url: process.env.SAP_URL,
        version: 'v2',
        csrf: true,
      }
    }
  }
})
\`\`\`
`,
  },
  {
    title: 'Query from a component',
    description: 'Use typed, auto-imported, SSR-safe helpers from your Vue components.',
    icon: 'i-lucide-terminal',
    code: `
\`\`\`vue [OrdersList.vue] {4-7}
<script setup lang="ts">
const { data: orders } = await useAsyncData(
  'recent-orders',
  () => odata.sap.SalesOrderSet
    .expand('Items')
    .orderBy('CreatedAt', 'desc')
    .top(20)
    .get()
)
<\/script>
\`\`\`
`,
  },
]

const active = ref(0)
</script>

<template>
  <UPageSection
    id="quickstart"
    headline="Quickstart"
    title="From install to typed queries"
    description="A smaller, docs-native quickstart that uses Nuxt UI cards and MDC code rendering."
    orientation="vertical"
    :ui="{ container: 'py-16 lg:py-20' }"
  >
    <div class="grid items-start gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
      <div class="grid gap-3">
        <UPageCard
          v-for="(step, index) in steps"
          :key="step.title"
          :title="step.title"
          :description="step.description"
          :icon="step.icon"
          :highlight="index === active"
          variant="subtle"
          class="cursor-pointer"
          @click="active = index"
        >
          <template #footer>
            <UBadge :color="index === active ? 'primary' : 'neutral'" variant="subtle">
              Step {{ index + 1 }}
            </UBadge>
          </template>
        </UPageCard>
      </div>

      <div class="[&_.prose-pre]:my-0! [&_.prose-pre]:min-h-[260px] lg:[&_.prose-pre]:min-h-[360px]">
        <MDC :value="steps[active]!.code" />
      </div>
    </div>
  </UPageSection>
</template>
