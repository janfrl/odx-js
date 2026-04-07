<script setup lang="ts">
import { computed } from 'vue'
import { useEntityExplorer } from '../../composables/useEntityExplorer'

const {
  previewColumns,
  previewData,
  previewLoading,
  previewError,
  showLoadingIndicator,
  entitySchemaLoading,
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
      class: 'sticky left-0 bg-muted z-20 shadow-[1px_0_0_0_rgba(0,0,0,0.1)] dark:shadow-[1px_0_0_0_rgba(255,255,255,0.1)]',
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
    <!-- Loading Indicator (Full Overlay) -->
    <div
      v-if="showLoadingIndicator || entitySchemaLoading"
      class="absolute inset-0 z-20 flex items-center justify-center bg-default/50 backdrop-blur-[1px]"
    >
      <UIcon name="i-lucide-refresh-cw" class="animate-spin w-10 h-10 text-primary" />
    </div>

    <!-- Main Content Area -->
    <div class="flex-1 overflow-auto custom-scrollbar h-full relative">
      <!--
        The Table itself.
        Even if there's an error, we keep the UTable rendered (if columns exist)
        so the HEADERS are visible. We just pass an empty data array.
      -->
      <UTable
        v-if="tableColumns.length > 1 && !previewLoading"
        :columns="tableColumns"
        :data="previewData?.length ? previewData : []"
        class="min-w-max"
        :ui="{
          thead: 'bg-default/10 sticky top-0 z-30 backdrop-blur-sm',
          th: 'text-[11px] font-bold tracking-widest text-muted border-b border-default py-4 px-6',
        }"
      >
        <!-- Hide the built-in empty slot when showing our own centered message -->
        <template #empty>
          <div class="h-32" />
        </template>

        <!-- Actions Column -->
        <template #actions-cell="{ row }">
          <div class="flex items-center justify-center gap-2 w-30 shrink-0 sticky left-0 z-10">
            <UButton icon="i-lucide-eye" variant="ghost" color="neutral" size="sm" class="hover:text-primary-500 hover:bg-primary-500/10 transition-colors" @click="openEditor('view', getRowData(row))" />
            <UButton icon="i-lucide-pencil" variant="ghost" color="neutral" size="sm" class="hover:text-primary-500 hover:bg-primary-500/10 transition-colors" @click="openEditor('update', getRowData(row))" />
            <UButton icon="i-lucide-trash-2" variant="ghost" color="neutral" size="sm" class="hover:text-error-500 hover:bg-error-500/10 transition-colors" @click="deleteItem(getRowData(row).ID || getRowData(row).Id)" />
          </div>
        </template>

        <!-- Dynamic Cells -->
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
                <span class="font-mono text-[13px] text-toned">{{ getValue() }}</span>
              </template>
            </div>
          </template>
        </template>
      </UTable>

      <!--
        Centrally positioned message container.
        By using absolute and inset-0 with flex, but only if data is empty,
        we get a message that is centered relative to the table's container
        (the viewport) rather than the table's scrollable width.
      -->
      <div
        v-if="(!previewData?.length || previewError) && tableColumns.length > 1 && !previewLoading"
        class="absolute inset-0 top-14 flex items-center justify-center pointer-events-none"
      >
        <div class="flex flex-col items-center justify-center p-12 text-center pointer-events-auto">
          <!-- Error State -->
          <template v-if="previewError">
            <div class="w-16 h-16 rounded-2xl bg-default border border-default flex items-center justify-center mb-6 shadow-sm">
              <UIcon name="i-lucide-triangle-alert" class="text-error-500 w-8 h-8" />
            </div>
            <h3 class="text-sm font-bold uppercase tracking-widest mb-2 text-default">
              Request Failed
            </h3>
            <p class="text-[12px] text-muted max-w-lg leading-relaxed mb-8 font-mono">
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
          </template>

          <!-- Empty State (No Data) -->
          <template v-else>
            <div class="w-16 h-16 rounded-2xl bg-default border border-default flex items-center justify-center mb-6 shadow-sm">
              <UIcon :name="previewData === null ? 'i-lucide-database-zap' : 'i-lucide-search-x'" class="text-muted w-8 h-8" />
            </div>
            <h3 class="text-sm font-bold uppercase tracking-widest mb-2 text-default">
              {{ previewData === null ? 'No data loaded yet' : 'No records found' }}
            </h3>
            <p class="text-[12px] text-muted max-w-70 leading-relaxed">
              {{ previewData === null
                ? 'Modify query parameters and click Execute to fetch records from the OData service.'
                : 'The OData service returned 0 items for the current query configuration.'
              }}
            </p>
          </template>
        </div>
      </div>

      <!-- Full-table Empty State (Only if Schema/Columns missing) -->
      <div
        v-if="tableColumns.length <= 1 && !previewLoading && !entitySchemaLoading"
        class="p-32 flex flex-col items-center justify-center opacity-40 italic text-muted"
      >
        <UIcon name="i-lucide-search-x" class="w-12 h-12 mb-4 opacity-20" />
        <p class="text-base uppercase tracking-[0.2em]">
          No schema available for this entity
        </p>
      </div>
    </div>
  </div>
</template>
