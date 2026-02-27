<script setup lang="ts">
import { useSchemaExplorer } from '../../composables/useSchemaExplorer'

const {
  editingEdgeId,
  editingLabelValue,
  editingLabelPos,
  saveEdgeLabel,
  cancelEdgeEdit,
  deleteEdge,
} = useSchemaExplorer()
</script>

<template>
  <template v-if="editingEdgeId">
    <div class="fixed inset-0 z-90" @click="cancelEdgeEdit" />
    <div
      class="fixed z-100 flex flex-col gap-4 p-3 bg-white dark:bg-neutral-900 ring-1 ring-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl"
      :style="{
        left: `${editingLabelPos.x}px`,
        top: `${editingLabelPos.y}px`,
        transform: 'translate(-50%, -120%)',
      }"
    >
      <div class="flex items-center gap-2">
        <UInput
          id="edge-label-input"
          v-model="editingLabelValue"
          placeholder="Label... (Enter to save)"
          size="sm"
          color="neutral"
          variant="outline"
          class="w-48 font-medium"
          @keyup.enter="saveEdgeLabel"
          @keyup.esc="cancelEdgeEdit"
          @keydown.ctrl.delete="deleteEdge"
        />
        <UButton
          icon="i-heroicons-trash"
          color="error"
          variant="soft"
          size="sm"
          class="shrink-0"
          title="Delete connection (Ctrl + Del)"
          @click="deleteEdge"
        />
      </div>
    </div>
  </template>
</template>
