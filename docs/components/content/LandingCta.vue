<script setup lang="ts">
const route = useRoute()
const localePrefix = computed(() => route.path.startsWith('/de') ? '/de' : '/en')

const links = computed(() => [
  {
    label: 'Read the docs',
    to: `${localePrefix.value}/ecosystem/introduction`,
    trailingIcon: 'i-lucide-arrow-right',
  },
  {
    label: 'Star on GitHub',
    to: 'https://github.com/janfrl/odx-js',
    target: '_blank',
    color: 'neutral' as const,
    variant: 'subtle' as const,
    icon: 'i-simple-icons-github',
  },
])

const installMarkdown = `
::code-group
  \`\`\`bash [Nuxt]
  pnpm add -D @bc8-odx/nuxt
  \`\`\`
  \`\`\`bash [Proxy]
  pnpm add @bc8-odx/proxy
  \`\`\`
  \`\`\`bash [Core]
  pnpm add @bc8-odx/core
  \`\`\`
  \`\`\`bash [Explorer]
  pnpm add -D @bc8-odx/explorer
  \`\`\`
::
`
</script>

<template>
  <UPageSection :ui="{ container: 'py-10 lg:py-16' }">
    <UPageCTA
      title="Start with the package you need"
      description="Install one package or compose the full ODX stack. Core, Proxy, Nuxt, and Explorer are designed to work independently and together."
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
