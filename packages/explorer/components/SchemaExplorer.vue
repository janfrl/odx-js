<script setup lang="ts">
import { useSchemaExplorer } from '../composables/useSchemaExplorer'

import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'

useSchemaExplorer()
</script>

<template>
  <div class="h-full flex flex-col overflow-hidden relative bg-neutral-50 dark:bg-neutral-950 font-sans">
    <div class="pt-4 px-4 pb-0 sm:pt-6 sm:px-6 flex-1 flex flex-col min-h-0">
      <div class="flex-1 flex flex-col min-h-0 overflow-hidden ring-1 ring-neutral-200 dark:ring-neutral-800 rounded-t-2xl bg-white dark:bg-neutral-900 shadow-sm transition-all">
        <SchemaToolbar />

        <SchemaGraph>
          <SchemaControls />
          <SchemaEdgeEditor />
        </SchemaGraph>
      </div>
    </div>
  </div>
</template>
