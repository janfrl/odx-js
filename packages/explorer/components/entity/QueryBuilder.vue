<script setup lang="ts">
import { computed } from 'vue'
import { useEntityExplorer } from '../../composables/useEntityExplorer'
import FilterGroup from './FilterGroup.vue'

const { queryState, currentEntitySchema, resetQuery } = useEntityExplorer()

const properties = computed(() => {
  return currentEntitySchema.value?.properties?.map((p: any) => p.name) || []
})

const navigationProperties = computed(() => {
  return currentEntitySchema.value?.navigationProperties?.map((np: any) => np.name) || []
})

function addSort() {
  queryState.value.sortBy.push({ field: properties.value[0] || '', direction: 'asc' })
}

function removeSort(index: number) {
  queryState.value.sortBy.splice(index, 1)
}
</script>

<template>
  <div class="p-4 bg-neutral-50 dark:bg-neutral-900/50 border-b border-neutral-200/50 dark:border-neutral-800/50 space-y-8">
    <!-- Filters Section -->
    <div class="space-y-4">
      <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 flex items-center gap-2">
        <UIcon name="i-lucide-filter" class="w-3 h-3" />
        Filter Logic
      </h3>

      <FilterGroup
        :group="queryState.filters"
        :properties="properties"
        :is-root="true"
      />
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-10">
      <!-- Row 1: Select & Sorting -->
      <div class="space-y-3">
        <div class="flex items-center h-8">
          <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 flex items-center gap-2">
            <UIcon name="i-lucide-check-square" class="w-3.5 h-3.5" />
            Field Selection ($select)
          </h3>
        </div>
        <div class="min-h-[32px]">
          <USelectMenu
            v-model="queryState.select"
            :items="properties"
            multiple
            size="xs"
            placeholder="Select specific fields..."
            class="w-full"
          />
        </div>
      </div>

      <div class="space-y-3">
        <div class="flex items-center justify-between h-8">
          <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 flex items-center gap-2">
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

        <div class="min-h-[32px] space-y-2">
          <div v-if="queryState.sortBy.length === 0" class="text-[11px] text-neutral-500 italic px-1 h-8 flex items-center">
            Default order
          </div>

          <div v-for="(sort, index) in queryState.sortBy" :key="index" class="grid grid-cols-[1fr_auto_40px] items-center gap-2 h-8">
            <USelectMenu
              v-model="sort.field"
              :items="properties"
              size="xs"
              class="min-w-0"
            />
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
                class="opacity-50 hover:!text-error-500 hover:!opacity-100 transition-all"
                @click="removeSort(index)"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Row 2: Expand & Pagination -->
      <div class="space-y-3">
        <div class="flex items-center h-8">
          <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 flex items-center gap-2">
            <UIcon name="i-lucide-external-link" class="w-3.5 h-3.5" />
            Data Expansion ($expand)
          </h3>
        </div>
        <div class="min-h-[32px]">
          <USelectMenu
            v-model="queryState.expand"
            :items="navigationProperties"
            multiple
            size="xs"
            placeholder="Expand navigation properties..."
            class="w-full"
          />
        </div>
      </div>

      <div class="space-y-3">
        <div class="flex items-center h-8">
          <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 flex items-center gap-2">
            <UIcon name="i-lucide-list-ordered" class="w-3.5 h-3.5" />
            Pagination ($top, $skip)
          </h3>
        </div>
        <div class="grid grid-cols-2 gap-4 min-h-[32px]">
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
        @click="resetQuery"
      />
    </div>
  </div>
</template>
