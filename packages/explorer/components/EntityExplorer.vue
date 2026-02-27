<script setup lang="ts">
import { useEntityExplorer } from '../composables/useEntityExplorer'
import EntityEmptyState from './entity/EmptyState.vue'
import EntityNavigation from './entity/Navigation.vue'
import EntityTable from './entity/Table.vue'
import EntityToolbar from './entity/Toolbar.vue'

const { selectedEntity, editor, refreshEntityData } = useEntityExplorer()
</script>

<template>
  <div class="h-full flex flex-col overflow-hidden font-sans text-xs">
    <!-- Main Wrapper -->
    <div class="flex-1 flex flex-col min-h-0 relative px-6 pb-0">
      <EntityNavigation />

      <!-- Empty State Unit -->
      <EntityEmptyState v-if="!selectedEntity" />

      <!-- Unified Content Block -->
      <div
        v-else
        class="flex-1 flex flex-col min-h-0 overflow-hidden border-t border-x border-neutral-200/70 dark:border-neutral-800/70 rounded-t-2xl bg-white dark:bg-neutral-900/50 shadow-2xl transition-all"
      >
        <EntityToolbar />
        <EntityTable />
      </div>
    </div>

    <DataEditor
      v-model:editor="editor"
      @refresh="refreshEntityData"
    />
  </div>
</template>
