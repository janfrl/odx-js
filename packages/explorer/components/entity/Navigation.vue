<script setup lang="ts">
import { useEntityExplorer } from '../../composables/useEntityExplorer'

const { navigationItems } = useEntityExplorer()
</script>

<template>
  <div class="shrink-0 overflow-x-auto custom-scrollbar mb-4">
    <UNavigationMenu
      :items="navigationItems"
      variant="link"
      highlight
      class="min-w-max data-[orientation=horizontal]:border-b border-default data-[orientation=horizontal]:w-full data-[orientation=vertical]:w-48"
    />
  </div>
</template>
