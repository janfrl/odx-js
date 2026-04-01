<script setup lang="ts">
import { ref } from 'vue'
import { useEntityExplorer } from '../../composables/useEntityExplorer'
import QueryBuilder from './QueryBuilder.vue'

const {
  queryInput,
  queryMethod,
  refreshEntityData,
  previewData,
  openEditor,
  downloadJson,
  clearData,
} = useEntityExplorer()

const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
const showBuilder = ref(false)
</script>

<template>
  <div class="flex flex-col shrink-0 bg-transparent rounded-t-[inherit] overflow-hidden">
    <!-- Query Area -->
    <div class="p-4 border-b border-default/50 flex items-center gap-4 bg-transparent backdrop-blur-md rounded-t-[inherit]">
      <USelect
        v-model="queryMethod"
        :items="methods"
        class="font-mono min-w-24"
        size="md"
        variant="subtle"
      />
      <div class="flex-1 flex items-center gap-2">
        <UInput
          v-model="queryInput"
          placeholder="?id=... or ?$filter=..."
          icon="i-lucide-search"
          class="flex-1 font-mono"
          size="md"
          @keyup.enter="refreshEntityData"
        >
          <template #trailing>
            <UKbd>Enter</UKbd>
          </template>
        </UInput>
        <UButton
          :icon="showBuilder ? 'i-lucide-chevron-up' : 'i-lucide-list-filter'"
          size="md"
          variant="ghost"
          color="neutral"
          :title="showBuilder ? 'Hide Builder' : 'Open Query Builder'"
          @click="showBuilder = !showBuilder"
        />
      </div>
      <UButton
        label="Execute"
        icon="i-lucide-play"
        color="primary"
        size="md"
        class="px-4 font-bold"
        @click="refreshEntityData"
      />
    </div>

    <!-- Visual Builder -->
    <QueryBuilder v-if="showBuilder" />

    <!-- Actions Area -->
    <div class="px-6 py-2 border-b border-default/50 flex items-center justify-between bg-muted/50">
      <div class="flex items-center gap-4">
        <span class="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
          {{ previewData?.length || 0 }} Results
        </span>
        <USeparator orientation="vertical" class="h-4" />
        <div class="flex items-center gap-2">
          <UButton label="Headers" icon="i-lucide-sliders-horizontal" variant="ghost" color="neutral" size="sm" @click="openEditor('headers')" />
          <template v-if="previewData && previewData.length > 0">
            <UButton label="JSON" icon="i-lucide-download" variant="ghost" color="neutral" size="sm" @click="downloadJson" />
            <UButton label="Clear" icon="i-lucide-trash-2" variant="ghost" color="error" size="sm" @click="clearData" />
          </template>
        </div>
      </div>
      <UButton
        label="New Record"
        icon="i-lucide-plus"
        variant="outline"
        color="neutral"
        size="sm"
        class="font-bold px-4"
        @click="openEditor('create')"
      />
    </div>
  </div>
</template>
