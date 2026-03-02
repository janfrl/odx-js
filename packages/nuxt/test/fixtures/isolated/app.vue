<script setup lang="ts">
import { useOData } from '#imports'
// useFetch returns { data, error, ... } where data is a Ref
const { data } = await useOData('NorthwindIsolated').entitySet('Categories').list()
</script>

<template>
  <div>
    <div v-if="data.value && data.value.length > 0" id="result">
      First Category: {{ data.value[0].CategoryName }}
    </div>
    <div v-else-if="data && data.value" id="empty-data">
      Data is empty array
    </div>
    <div v-else id="empty">
      No data found
    </div>
  </div>
</template>
