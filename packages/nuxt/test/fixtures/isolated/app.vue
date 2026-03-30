<script setup lang="ts">
import { useOData } from '#imports'
// useFetch returns { data, error, ... } where data is a Ref
const { data } = await useOData('NorthwindIsolated').entitySet('Categories').list()
</script>

<template>
  <div>
    <div v-if="data && data.length > 0" id="result">
      First Category: {{ data[0].CategoryName }}
    </div>
    <div v-else-if="data" id="empty-data">
      Data is empty array
    </div>
    <div v-else id="empty">
      No data found
    </div>
  </div>
</template>
