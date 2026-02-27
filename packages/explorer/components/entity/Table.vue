<script setup lang="ts">
import { computed } from 'vue'
import { useEntityExplorer } from '../../composables/useEntityExplorer'

const {
  previewColumns,
  previewData,
  previewLoading,
  previewError,
  showLoadingIndicator,
  refreshEntityData,
  openEditor,
  deleteItem,
  isNavigationProperty,
} = useEntityExplorer()

const tableColumns = computed<any[]>(() => {
  const cols = previewColumns.value || []
  return [
    {
      id: 'actions',
      header: 'Actions',
      size: 140,
      minSize: 140,
      maxSize: 140,
      class: 'sticky left-0 bg-neutral-50 dark:bg-neutral-900 z-20 shadow-[1px_0_0_0_rgba(0,0,0,0.1)] dark:shadow-[1px_0_0_0_rgba(255,255,255,0.1)]',
    },
    ...cols.map((c: string) => ({
      id: c,
      accessorKey: c,
      header: c,
    })),
  ]
})

function getRowData(row: any): Record<string, any> {
  return row?.original || {}
}
</script>

<template>
  <div class="flex-1 min-h-0 relative flex flex-col overflow-hidden">
    <!-- Loading Indicator -->
    <div
      v-if="showLoadingIndicator"
      class="absolute inset-0 z-20 flex items-center justify-center bg-white/50 dark:bg-black/50 backdrop-blur-[1px]"
    >
      <UIcon name="i-heroicons-arrow-path" class="animate-spin w-10 h-10 text-primary" />
    </div>

    <!-- Error State -->
    <div
      v-if="previewError"
      class="flex-1 flex flex-col items-center justify-center text-center p-12"
    >
      <div class="w-16 h-16 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center mb-6 shadow-sm">
        <UIcon name="i-heroicons-exclamation-triangle" class="text-error-500 w-8 h-8" />
      </div>
      <h3 class="text-sm font-bold uppercase tracking-widest mb-2 text-neutral-900 dark:text-neutral-100">
        Request Failed
      </h3>
      <p class="text-[12px] text-neutral-500 dark:text-neutral-400 max-w-lg leading-relaxed mb-8 font-mono">
        {{ previewError }}
      </p>
      <UButton
        label="Retry Request"
        color="neutral"
        variant="soft"
        size="md"
        class="px-8 font-bold"
        @click="refreshEntityData"
      />
    </div>

    <!-- Table Content -->
    <div v-else class="flex-1 overflow-auto custom-scrollbar h-full">
      <UTable
        v-if="tableColumns.length > 1 && !previewLoading"
        :columns="tableColumns"
        :data="previewData || []"
        class="min-w-max h-full"
        :ui="{
          thead: 'bg-neutral-50/80 dark:bg-neutral-900/80 sticky top-0 z-30 backdrop-blur-sm',
          th: 'text-[11px] font-bold uppercase tracking-widest text-neutral-500 border-b border-neutral-200/50 dark:border-neutral-800/50 py-4 px-6',
        }"
      >
        <template #actions-cell="{ row }">
          <div class="flex items-center justify-center gap-2 w-30 shrink-0 sticky left-0 z-10">
            <UButton icon="i-heroicons-eye" variant="ghost" color="neutral" size="sm" @click="openEditor('view', getRowData(row))" />
            <UButton icon="i-heroicons-pencil" variant="ghost" color="neutral" size="sm" @click="openEditor('update', getRowData(row))" />
            <UButton icon="i-heroicons-trash" variant="ghost" color="error" size="sm" @click="deleteItem(getRowData(row).ID || getRowData(row).Id)" />
          </div>
        </template>

        <template v-for="col in tableColumns.filter(c => c.id !== 'actions')" :key="col.id" #[`${col.id}-cell`]="{ getValue, row }">
          <template v-if="getRowData(row)">
            <div class="px-2 py-1">
              <template v-if="Array.isArray(getValue())">
                <UButton :label="`${(getValue() as any[]).length} Items`" variant="soft" color="primary" size="xs" class="font-bold" @click.stop="openEditor('view', getValue())" />
              </template>
              <template v-else-if="getValue() && typeof getValue() === 'object'">
                <UButton label="Object" variant="soft" color="neutral" size="xs" class="font-bold" @click.stop="openEditor('view', getValue())" />
              </template>
              <template v-else-if="getValue() === null">
                <span class="opacity-20 italic text-[11px]">{{ isNavigationProperty(col.id) ? 'not expanded' : '-' }}</span>
              </template>
              <template v-else>
                <span class="font-mono text-[13px] text-neutral-700 dark:text-neutral-300">{{ getValue() }}</span>
              </template>
            </div>
          </template>
        </template>
      </UTable>

      <!-- Empty Data State -->
      <div
        v-if="previewData.length === 0 && !previewLoading"
        class="p-32 flex flex-col items-center justify-center opacity-40 italic text-neutral-500"
      >
        <UIcon name="i-heroicons-magnifying-glass" class="w-12 h-12 mb-4 opacity-20" />
        <p class="text-base uppercase tracking-[0.2em]">
          No records match your query
        </p>
      </div>
    </div>
  </div>
</template>
