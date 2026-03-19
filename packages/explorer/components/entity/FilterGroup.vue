<script setup lang="ts">
import type { FilterGroup, FilterRule } from '../../composables/useODataState'

const props = defineProps<{
  group: FilterGroup
  isRoot?: boolean
  properties: string[]
}>()

const emit = defineEmits<{
  (e: 'remove'): void
}>()

const operators = [
  { label: 'Equals', value: 'eq' },
  { label: 'Not Equals', value: 'ne' },
  { label: 'Greater Than', value: 'gt' },
  { label: 'Less Than', value: 'lt' },
  { label: 'Contains', value: 'contains' },
  { label: 'Starts With', value: 'startswith' },
  { label: 'Ends With', value: 'endswith' },
  { label: 'Is Null', value: 'eq null' },
  { label: 'Is Not Null', value: 'ne null' },
]

const noValueOperators = ['eq null', 'ne null']

function addRule() {
  props.group.items.push({
    type: 'rule',
    field: props.properties[0] || '',
    operator: 'eq',
    value: '',
  })
}

function addGroup() {
  props.group.items.push({
    type: 'group',
    logic: 'and',
    items: [],
  })
}

function removeItem(index: number) {
  props.group.items.splice(index, 1)
}

function isGroup(item: FilterRule | FilterGroup): item is FilterGroup {
  return item.type === 'group'
}

function isRule(item: FilterRule | FilterGroup): item is FilterRule {
  return item.type === 'rule'
}
</script>

<template>
  <div
    class="flex flex-col gap-3"
    :class="[
      !isRoot ? 'ml-6 pl-4 border-l-2 border-neutral-200 dark:border-neutral-800' : '',
    ]"
  >
    <!-- Group Header -->
    <div class="flex items-center justify-between group/header">
      <div class="flex items-center gap-3">
        <USelect
          v-model="group.logic"
          :items="['and', 'or']"
          size="xs"
          variant="subtle"
          class="w-20 font-bold uppercase"
        />

        <div class="flex items-center gap-1">
          <UButton
            icon="i-lucide-plus"
            size="xs"
            variant="ghost"
            color="neutral"
            label="Rule"
            @click="addRule"
          />
          <UButton
            icon="i-lucide-folder-plus"
            size="xs"
            variant="ghost"
            color="neutral"
            label="Group"
            @click="addGroup"
          />
        </div>
      </div>

      <UButton
        v-if="!isRoot"
        icon="i-lucide-trash-2"
        size="xs"
        variant="ghost"
        color="neutral"
        class="opacity-0 group-hover/header:opacity-50 hover:!text-error-500 hover:!opacity-100 transition-all"
        @click="emit('remove')"
      />
    </div>

    <!-- Items -->
    <div v-if="group.items.length === 0" class="text-[11px] text-neutral-500 italic ml-2">
      No rules in this group
    </div>

    <div
      v-for="(item, index) in group.items"
      :key="index"
      class="flex flex-col gap-3"
    >
      <!-- Nested Group -->
      <FilterGroup
        v-if="isGroup(item)"
        :group="item"
        :properties="properties"
        @remove="removeItem(index)"
      />

      <!-- Rule Row -->
      <div
        v-else-if="isRule(item)"
        class="grid grid-cols-[1fr_auto_1fr_40px] items-center gap-2 h-8"
      >
        <USelectMenu
          v-model="item.field"
          :items="properties"
          size="xs"
          placeholder="Property"
          class="min-w-0"
        />

        <USelectMenu
          v-model="item.operator"
          :items="operators"
          size="xs"
          class="w-32"
        />

        <div class="min-w-0 flex-1 h-8 flex items-center">
          <UInput
            v-if="!noValueOperators.includes(item.operator)"
            v-model="item.value"
            size="xs"
            placeholder="Value"
            class="w-full"
          />
          <div v-else class="w-full h-8 bg-neutral-100/50 dark:bg-neutral-800/50 rounded-md border border-neutral-200/50 dark:border-neutral-700/50" />
        </div>

        <div class="flex justify-end">
          <UButton
            icon="i-lucide-trash-2"
            size="xs"
            variant="ghost"
            color="neutral"
            class="opacity-50 hover:!text-error-500 hover:!opacity-100 transition-all"
            @click="removeItem(index)"
          />
        </div>
      </div>
    </div>
  </div>
</template>
