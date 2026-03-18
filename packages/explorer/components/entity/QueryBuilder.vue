<script setup lang="ts">
import { computed } from 'vue'
import { useEntityExplorer } from '../../composables/useEntityExplorer'

const { queryState, currentEntitySchema, resetQuery } = useEntityExplorer()

const operators = [
  { label: 'Equals', value: 'eq' },
  { label: 'Not Equals', value: 'ne' },
  { label: 'Greater Than', value: 'gt' },
  { label: 'Less Than', value: 'lt' },
  { label: 'Contains', value: 'contains' },
  { label: 'Starts With', value: 'startswith' },
  { label: 'Ends With', value: 'endswith' },
]

const properties = computed(() => {
  return currentEntitySchema.value?.properties?.map((p: any) => p.name) || []
})

const navigationProperties = computed(() => {
  return currentEntitySchema.value?.navigationProperties?.map((np: any) => np.name) || []
})

function addFilter() {
  queryState.value.filters.push({ field: properties.value[0] || '', operator: 'eq', value: '' })
}

function removeFilter(index: number) {
  queryState.value.filters.splice(index, 1)
}

function addSort() {
  queryState.value.sortBy.push({ field: properties.value[0] || '', direction: 'asc' })
}

function removeSort(index: number) {
  queryState.value.sortBy.splice(index, 1)
}
</script>

<template>
  <div class="p-4 bg-neutral-50 dark:bg-neutral-900/50 border-b border-neutral-200/50 dark:border-neutral-800/50 space-y-6">
    <!-- Filters -->
    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <h3 class="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
          Filters
        </h3>
        <UButton
          icon="i-lucide-plus"
          size="2xs"
          variant="ghost"
          color="neutral"
          label="Add Filter"
          @click="addFilter"
        />
      </div>

      <div v-if="queryState.filters.length === 0" class="text-[11px] text-neutral-500 italic">
        No filters active
      </div>

      <div v-for="(filter, index) in queryState.filters" :key="index" class="flex items-center gap-2">
        <USelectMenu
          v-model="filter.field"
          :items="properties"
          size="sm"
          class="flex-1"
          placeholder="Property"
        />
        <USelectMenu
          v-model="filter.operator"
          :items="operators"
          size="sm"
          class="w-32"
        />
        <UInput
          v-model="filter.value"
          size="sm"
          class="flex-1"
          placeholder="Value"
        />
        <UButton
          icon="i-lucide-x"
          size="2xs"
          variant="ghost"
          color="error"
          @click="removeFilter(index)"
        />
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Select & Expand -->
      <div class="space-y-4">
        <div class="space-y-2">
          <h3 class="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
            Select Fields ($select)
          </h3>
          <USelectMenu
            v-model="queryState.select"
            :items="properties"
            multiple
            size="sm"
            placeholder="All properties"
          />
        </div>

        <div class="space-y-2">
          <h3 class="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
            Expand ($expand)
          </h3>
          <USelectMenu
            v-model="queryState.expand"
            :items="navigationProperties"
            multiple
            size="sm"
            placeholder="No expansions"
          />
        </div>
      </div>

      <!-- Sorting & Pagination -->
      <div class="space-y-4">
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <h3 class="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
              Sorting
            </h3>
            <UButton
              icon="i-lucide-plus"
              size="2xs"
              variant="ghost"
              color="neutral"
              @click="addSort"
            />
          </div>
          <div v-for="(sort, index) in queryState.sortBy" :key="index" class="flex items-center gap-2">
            <USelectMenu
              v-model="sort.field"
              :items="properties"
              size="sm"
              class="flex-1"
            />
            <USelect
              v-model="sort.direction"
              :items="['asc', 'desc']"
              size="sm"
              class="w-20"
            />
            <UButton
              icon="i-lucide-x"
              size="2xs"
              variant="ghost"
              color="error"
              @click="removeSort(index)"
            />
          </div>
        </div>

        <div class="flex gap-4">
          <div class="flex-1 space-y-2">
            <h3 class="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
              Top
            </h3>
            <UInput v-model="queryState.top" type="number" size="sm" placeholder="All" />
          </div>
          <div class="flex-1 space-y-2">
            <h3 class="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
              Skip
            </h3>
            <UInput v-model="queryState.skip" type="number" size="sm" placeholder="0" />
          </div>
        </div>
      </div>
    </div>

    <div class="flex justify-end pt-2">
      <UButton
        label="Clear Builder"
        icon="i-lucide-trash-2"
        size="xs"
        variant="ghost"
        color="neutral"
        @click="resetQuery"
      />
    </div>
  </div>
</template>
