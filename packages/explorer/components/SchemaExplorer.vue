<script setup lang="ts">
import { useSchemaExplorer } from '../composables/useSchemaExplorer'

import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'

useSchemaExplorer()
</script>

<template>
  <div class="h-full flex flex-col overflow-hidden font-sans text-xs">
    <!-- Main Wrapper -->
    <div class="flex-1 flex flex-col min-h-0 relative px-6 pb-0">
      <!-- Unified Content Block -->
      <div
        class="flex-1 flex flex-col min-h-0 overflow-hidden border-t border-x border-neutral-200/70 dark:border-neutral-800/70 rounded-t-2xl bg-white dark:bg-neutral-900/50 shadow-2xl transition-all"
      >
        <SchemaToolbar />

        <SchemaGraph>
          <SchemaControls />
          <SchemaEdgeEditor />
        </SchemaGraph>
      </div>
    </div>
  </div>
</template>
