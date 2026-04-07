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
        class="flex-1 flex flex-col min-h-0 overflow-hidden bg-default/50 border-t border-x border-default/70 rounded-t-2xl shadow-xl transition-all"
      >
        <SchemaGraph>
          <SchemaControls />
          <SchemaHotkeys />
        </SchemaGraph>
      </div>
    </div>
  </div>
</template>
