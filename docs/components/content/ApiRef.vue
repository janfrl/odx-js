<script setup lang="ts">
// Import the JSON directly for instant SSR rendering and zero network overhead.
import apiReferenceData from '../../public/api-reference.json'

const props = defineProps<{
  name: string
}>()

const item = computed(() => (apiReferenceData as any)[props.name])
</script>

<template>
  <div v-if="item" class="api-ref-container my-8">
    <h3 class="text-xl font-bold mb-4">{{ item.title }}</h3>
    <MDC v-if="item.description" :value="item.description" class="prose-sm mb-4" />

    <ProseTable>
      <ProseThead>
        <ProseTr>
          <ProseTh>Property</ProseTh>
          <ProseTh>Type</ProseTh>
          <ProseTh>Default</ProseTh>
          <ProseTh>Description</ProseTh>
        </ProseTr>
      </ProseThead>
      <ProseTbody>
        <ProseTr v-for="prop in item.properties" :key="prop.name">
          <ProseTd>
            <span class="font-mono text-sm font-semibold text-primary-500 whitespace-nowrap">
              {{ prop.name }}<span v-if="prop.required" class="text-red-500 ml-0.5">*</span>
            </span>
          </ProseTd>

          <ProseTd class="type-column">
            <!-- Use single backticks for clean inline code rendering in tables -->
            <MDC v-if="prop.type" :value="`\`${prop.type}\``" unwrap="p" />
          </ProseTd>

          <ProseTd class="default-column">
            <MDC v-if="prop.default" :value="`\`${prop.default}\``" unwrap="p" />
            <span v-else class="text-gray-400 dark:text-gray-600">-</span>
          </ProseTd>

          <ProseTd class="text-sm description-column">
            <!-- Descriptions can contain markdown, rendered via MDC -->
            <MDC :value="prop.description || '_No description_'" unwrap="p" />
          </ProseTd>
        </ProseTr>
      </ProseTbody>
    </ProseTable>
  </div>
  <div v-else class="p-4 border border-yellow-200 bg-yellow-50 text-yellow-700 rounded my-4">
    Reference for <strong>{{ name }}</strong> not found in generated data.
  </div>
</template>

<style scoped>
/* 
  Ensure the table columns handle long content gracefully.
  We use table-layout auto so columns adjust to their content.
*/
:deep(.prose-table) {
  table-layout: auto !important;
}

:deep(td) {
  vertical-align: top !important;
}

/* Limit column widths to prevent excessive horizontal scrolling on standard screens */
.type-column {
  max-width: 250px;
  overflow-x: auto;
}

.default-column {
  max-width: 150px;
}

.description-column {
  min-width: 200px;
}

/* Ensure inline code wraps if necessary */
:deep(code) {
  white-space: pre-wrap !important;
  word-break: break-word !important;
}
</style>
