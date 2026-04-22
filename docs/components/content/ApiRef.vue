<script setup lang="ts">
import apiReferenceData from '../../public/api-reference.json'

const props = defineProps<{
  name: string
}>()

const item = computed(() => (apiReferenceData as any)[props.name])
</script>

<template>
  <div v-if="item" class="api-ref-block my-8">
    <h3 class="text-xl font-bold mb-2">
      {{ item.title }}
    </h3>
    <p v-if="item.description" class="text-gray-600 dark:text-gray-400 mb-4 whitespace-pre-wrap">
      {{ item.description }}
    </p>

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
            <ProseCode inline>
              {{ prop.name }}
            </ProseCode>
          </ProseTd>
          <ProseTd>
            <ProseCode inline>
              {{ prop.type }}
            </ProseCode>
          </ProseTd>
          <ProseTd>
            <ProseCode v-if="prop.default" inline>
              {{ prop.default }}
            </ProseCode>
            <span v-else>-</span>
          </ProseTd>
          <ProseTd>
            {{ prop.description || '-' }}
          </ProseTd>
        </ProseTr>
      </ProseTbody>
    </ProseTable>
  </div>
  <div v-else class="p-4 border border-yellow-200 bg-yellow-50 text-yellow-700 rounded my-4">
    Reference for <strong>{{ name }}</strong> not found in generated data.
  </div>
</template>
