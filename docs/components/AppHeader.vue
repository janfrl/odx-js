<script setup lang="ts">
const { docus: config } = useAppConfig()
</script>

<template>
  <header class="sticky top-0 z-50 w-full backdrop-blur border-b border-neutral-200 dark:border-neutral-800 bg-white/75 dark:bg-neutral-900/75">
    <nav class="mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl h-16 flex items-center justify-between gap-3">
      <!-- Left: Logo & Title -->
      <div class="flex items-center gap-3 lg:flex-1">
        <NuxtLink to="/" class="flex items-center gap-2 group">
          <div class="w-8 h-8 bg-neutral-900 dark:bg-white rounded-lg flex items-center justify-center text-white dark:text-neutral-900 font-bold transition-transform group-hover:scale-110">
            O
          </div>
          <span class="font-bold text-xl tracking-tight text-neutral-900 dark:text-white">
            ODX
          </span>
        </NuxtLink>
      </div>

      <!-- Right: Resources, Search, Socials, Theme -->
      <div class="flex items-center justify-end gap-1.5 lg:flex-1">
        <!-- Text Links (Nuxt UI Style) -->
        <div class="hidden md:flex items-center gap-4 mr-4 border-r border-neutral-200 dark:border-neutral-800 pr-4">
          <NuxtLink 
            to="https://github.com/janfrl/odx-js/releases" 
            target="_blank"
            class="text-sm font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors"
          >
            Releases
          </NuxtLink>
          <NuxtLink 
            to="/guide/quick-start" 
            class="text-sm font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors"
          >
            Examples
          </NuxtLink>
          <NuxtLink 
            to="https://odx-js.io/playground" 
            target="_blank"
            class="text-sm font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors"
          >
            Playground
          </NuxtLink>
        </div>

        <AppSearch v-if="config.header?.search" />

        <div class="flex items-center gap-0.5">
          <AppHeaderSocial />
          <AppColorMode class="hidden md:flex" />
        </div>
      </div>
    </nav>
  </header>
</template>
