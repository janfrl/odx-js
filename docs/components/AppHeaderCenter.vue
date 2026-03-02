<script setup lang="ts">
const route = useRoute()

const links = computed(() => [
  {
    label: 'Guide',
    icon: 'i-lucide-book-open',
    to: '/getting-started/introduction',
    active: route.path.startsWith('/getting-started') || route.path.startsWith('/nuxt') || route.path.startsWith('/proxy') || route.path.startsWith('/explorer') || route.path.startsWith('/core') || route.path.startsWith('/guides'),
  },
  {
    label: 'Playground',
    icon: 'i-lucide-play',
    to: 'https://odx-js.io/playground',
    target: '_blank',
  },
  {
    label: 'Releases',
    icon: 'i-lucide-rocket',
    to: 'https://github.com/janfrl/odx-js/releases',
    target: '_blank',
  },
])
</script>

<template>
  <UNavigationMenu
    :items="links"
    variant="link"
  />
</template>
