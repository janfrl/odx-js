<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
const odata = useOData('dummy')

const { data, pending, error, refresh } = await odata.list()

async function addItem() {
  await odata.create({ Name: 'New Entry' })
  refresh()
}
</script>

<template>
  <div class="p-4 space-y-2">
    <h1 class="text-xl font-semibold">
      OData Test
    </h1>

    <button
      class="px-3 py-1 bg-blue-500 text-white rounded"
      @click="addItem"
    >
      Add Item
    </button>

    <div v-if="pending">
      Loading...
    </div>
    <div v-else-if="error">
      {{ error }}
    </div>
    <pre v-else>{{ data }}</pre>
  </div>
</template>
