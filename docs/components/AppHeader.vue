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
          <span class="font-bold text-xl tracking-tight text-gray-900 dark:text-white">
            ODX
          </span>
        </NuxtLink>
      </div>

      <!-- Center: Navigation -->
      <div class="hidden lg:flex items-center justify-center">
        <AppHeaderCenter />
      </div>

      <!-- Right: Search, Socials, Theme -->
      <div class="flex items-center justify-end gap-1.5 lg:flex-1">
        <div class="flex items-center gap-0.5">
          <ClientOnly>
            <LanguageSelect />
            <template #fallback>
              <div class="h-8 w-8 animate-pulse bg-neutral-200 dark:bg-neutral-800 rounded-md" />
            </template>
          </ClientOnly>

          <UButton
            v-if="config.socials?.github"
            :to="`https://github.com/${config.socials.github}`"
            target="_blank"
            color="neutral"
            variant="ghost"
            icon="i-simple-icons-github"
          />
          <UColorModeButton />
        </div>
      </div>
    </nav>
  </header>
</template>
