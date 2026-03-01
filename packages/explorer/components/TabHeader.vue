<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <div class="px-6 py-6 lg:py-8 shrink-0">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
      <header class="flex flex-col gap-1.5">
        <h1 class="text-xl font-bold text-neutral-900 dark:text-white tracking-tight">
          {{ title }}
        </h1>
        <p v-if="description" class="text-sm text-neutral-500 dark:text-neutral-400">
          {{ description }}
        </p>
      </header>

      <div v-if="$slots.default" class="flex items-center gap-3">
        <slot />
      </div>
    </div>
  </div>
</template>
