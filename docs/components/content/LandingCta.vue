<script setup lang="ts">
const props = withDefaults(defineProps<{
  docsLabel?: string
  docsTo?: string
  githubLabel?: string
  githubTo?: string
  title?: string
  description?: string
}>(), {
  docsLabel: 'Read the docs',
  docsTo: '/en/ecosystem/introduction',
  githubLabel: 'Star on GitHub',
  githubTo: 'https://github.com/me-tools/odx',
  title: 'Start with the package you need',
  description: 'Install one package or compose the full ODX stack. Core, Proxy, Nuxt, and Explorer are designed to work independently and together.',
})

const links = computed(() => [
  {
    label: props.docsLabel,
    to: props.docsTo,
    trailingIcon: 'i-lucide-arrow-right',
  },
  {
    label: props.githubLabel,
    to: props.githubTo,
    target: '_blank',
    color: 'neutral' as const,
    variant: 'subtle' as const,
    icon: 'i-simple-icons-github',
  },
])

const installMarkdown = `
::code-group
  \`\`\`bash [Nuxt]
  pnpm add -D @me-tools/odx-nuxt
  \`\`\`
  \`\`\`bash [Proxy]
  pnpm add @me-tools/odx-proxy
  \`\`\`
  \`\`\`bash [Core]
  pnpm add @me-tools/odx-core
  \`\`\`
  \`\`\`bash [Explorer]
  pnpm add -D @me-tools/odx-explorer
  \`\`\`
::
`
</script>

<template>
  <UPageSection :ui="{ container: 'py-10 lg:py-16' }">
    <UPageCTA
      :title="props.title"
      :description="props.description"
      orientation="horizontal"
      variant="subtle"
      :links="links"
      :ui="{
        root: 'ring ring-primary/20 bg-gradient-to-br from-primary/10 via-elevated/50 to-elevated/50',
        container: 'items-center',
      }"
    >
      <div class="w-full mdc-install">
        <MDC :value="installMarkdown" />
      </div>
    </UPageCTA>
  </UPageSection>
</template>

<style scoped>
.mdc-install :deep(.prose-code-group) {
  margin: 0;
}

.mdc-install :deep(.prose-pre) {
  margin: 0;
}
</style>
