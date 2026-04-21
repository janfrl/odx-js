<script setup lang="ts">
const route = useRoute()

const links = computed(() => [
  {
    label: 'Guide',
    icon: 'i-lucide-book-open',
    to: '/tutorials/introduction',
    active: route.path.startsWith('/tutorials') || route.path.startsWith('/how-to') || route.path.startsWith('/reference') || route.path.startsWith('/explanation'),
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
