<script setup lang="ts">
import { computed, ref } from 'vue'
import { useEntityExplorer } from '../../composables/useEntityExplorer'
import FilterGroup from './FilterGroup.vue'

const { queryState, currentEntitySchema, resetQuery } = useEntityExplorer()

interface FieldMenuItem {
  label: string
  value: string
  tooltip?: string
}

const properties = computed(() => {
  return currentEntitySchema.value?.properties?.map((p: any) => p.name) || []
})

const propertyItems = computed<FieldMenuItem[]>(() => {
  return currentEntitySchema.value?.properties?.map((p: any) => ({
    label: p.name,
    value: p.name,
    tooltip: getFieldTooltip(p),
  })) || []
})

const navigationPropertyItems = computed<FieldMenuItem[]>(() => {
  return currentEntitySchema.value?.navigationProperties?.map((np: any) => ({
    label: np.name,
    value: np.name,
    tooltip: getFieldTooltip(np),
  })) || []
})

const showResetConfirm = ref(false)

function addSort() {
  queryState.value.sortBy.push({ field: properties.value[0] || '', direction: 'asc' })
}

function removeSort(index: number) {
  queryState.value.sortBy.splice(index, 1)
}

function getFieldTooltip(field: any): string | undefined {
  const description = field.description || field.documentation || field.summary
  return typeof description === 'string' && description.trim() ? description : undefined
}

function confirmReset() {
  resetQuery()
  showResetConfirm.value = false
}
</script>

<template>
  <div class="p-4 bg-muted/50 border-b border-default/50 space-y-8">
    <!-- Filters Section -->
    <div class="space-y-4">
      <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-muted flex items-center gap-2">
        <UIcon name="i-lucide-filter" class="w-3 h-3" />
        Filter Logic
      </h3>

      <FilterGroup
        v-model="queryState.filters"
        :properties="properties"
        :is-root="true"
      />
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-10">
      <!-- Row 1: Select & Sorting -->
      <div class="space-y-3">
        <div class="flex items-center h-8">
          <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-muted flex items-center gap-2">
            <UIcon name="i-lucide-check-square" class="w-3.5 h-3.5" />
            Field Selection ($select)
          </h3>
        </div>
        <div class="min-h-8">
          <USelectMenu
            v-model="queryState.select"
            :items="propertyItems"
            value-key="value"
            multiple
            size="xs"
            placeholder="Select specific fields..."
            class="w-full"
          >
            <template #item-label="{ item }">
              <UTooltip v-if="item.tooltip" :text="item.tooltip" :content="{ side: 'right' }">
                <span class="truncate">{{ item.label }}</span>
              </UTooltip>
              <span v-else class="truncate">{{ item.label }}</span>
            </template>
          </USelectMenu>
        </div>
      </div>

      <div class="space-y-3">
        <div class="flex items-center justify-between h-8">
          <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-muted flex items-center gap-2">
            <UIcon name="i-lucide-arrow-up-narrow-wide" class="w-3.5 h-3.5" />
            Ordering ($orderby)
          </h3>
          <UButton
            icon="i-lucide-plus"
            size="xs"
            variant="ghost"
            color="neutral"
            label="Add Sort"
            @click="addSort"
          />
        </div>

        <div class="min-h-8 space-y-2">
          <div v-if="queryState.sortBy.length === 0" class="text-[11px] text-muted italic px-1 h-8 flex items-center">
            Default order
          </div>

          <div v-for="(sort, index) in queryState.sortBy" :key="index" class="grid grid-cols-[1fr_auto_40px] items-center gap-2 h-8">
            <USelectMenu
              v-model="sort.field"
              :items="propertyItems"
              value-key="value"
              size="xs"
              class="min-w-0"
            >
              <template #item-label="{ item }">
                <UTooltip v-if="item.tooltip" :text="item.tooltip" :content="{ side: 'right' }">
                  <span class="truncate">{{ item.label }}</span>
                </UTooltip>
                <span v-else class="truncate">{{ item.label }}</span>
              </template>
            </USelectMenu>
            <USelect
              v-model="sort.direction"
              :items="['asc', 'desc']"
              size="xs"
              class="w-24 uppercase font-bold"
            />
            <div class="flex justify-end">
              <UButton
                icon="i-lucide-trash-2"
                size="xs"
                variant="ghost"
                color="neutral"
                class="opacity-50 hover:text-error-500! hover:opacity-100! transition-all"
                @click="removeSort(index)"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Row 2: Expand & Pagination -->
      <div class="space-y-3">
        <div class="flex items-center h-8">
          <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-muted flex items-center gap-2">
            <UIcon name="i-lucide-external-link" class="w-3.5 h-3.5" />
            Data Expansion ($expand)
          </h3>
        </div>
        <div class="min-h-8">
          <USelectMenu
            v-model="queryState.expand"
            :items="navigationPropertyItems"
            value-key="value"
            multiple
            size="xs"
            placeholder="Expand navigation properties..."
            class="w-full"
          >
            <template #item-label="{ item }">
              <UTooltip v-if="item.tooltip" :text="item.tooltip" :content="{ side: 'right' }">
                <span class="truncate">{{ item.label }}</span>
              </UTooltip>
              <span v-else class="truncate">{{ item.label }}</span>
            </template>
          </USelectMenu>
        </div>
      </div>

      <div class="space-y-3">
        <div class="flex items-center h-8">
          <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-muted flex items-center gap-2">
            <UIcon name="i-lucide-list-ordered" class="w-3.5 h-3.5" />
            Pagination ($top, $skip)
          </h3>
        </div>
        <div class="grid grid-cols-2 gap-4 min-h-8">
          <UInput v-model="queryState.top" type="number" size="xs" placeholder="Limit ($top)" icon="i-lucide-hash" />
          <UInput v-model="queryState.skip" type="number" size="xs" placeholder="Offset ($skip)" icon="i-lucide-step-forward" />
        </div>
      </div>
    </div>

    <div class="flex justify-end pt-4 border-t border-neutral-200/50 dark:border-neutral-800/50">
      <UButton
        label="Reset Builder"
        icon="i-lucide-rotate-ccw"
        size="xs"
        variant="ghost"
        color="neutral"
        class="font-bold opacity-70 hover:opacity-100 transition-opacity"
        @click="showResetConfirm = true"
      />
    </div>

    <UModal
      v-model:open="showResetConfirm"
      title="Reset query builder?"
      description="This clears selected fields, filters, sorting, expansion, and pagination."
    >
      <template #footer>
        <div class="flex items-center justify-end gap-3 w-full">
          <UButton
            label="Cancel"
            color="neutral"
            variant="soft"
            size="sm"
            @click="showResetConfirm = false"
          />
          <UButton
            label="Reset"
            icon="i-lucide-rotate-ccw"
            color="error"
            size="sm"
            @click="confirmReset"
          />
        </div>
      </template>
    </UModal>
  </div>
</template>
