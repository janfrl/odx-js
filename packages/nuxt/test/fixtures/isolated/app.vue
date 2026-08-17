<script setup lang="ts">
import { useOData } from '#imports'

const categoryQuery = {
  $filter: 'CategoryID eq 1',
  $select: ['CategoryID', 'CategoryName'],
  $top: 1,
}

const { data: v4Categories } = await useOData('NorthwindV4Isolated')
  .entitySet('Categories')
  .list(categoryQuery)
const { data: v2Categories } = await useOData('NorthwindV2Isolated')
  .entitySet('Categories')
  .list(categoryQuery)
</script>

<template>
  <div>
    <div v-if="v4Categories && v4Categories.length > 0" id="result-v4">
      First V4 Category: {{ v4Categories[0].CategoryName }}
    </div>
    <div v-else id="empty-v4">
      No V4 data found
    </div>

    <div v-if="v2Categories && v2Categories.length > 0" id="result-v2">
      First V2 Category: {{ v2Categories[0].CategoryName }}
    </div>
    <div v-else id="empty-v2">
      No V2 data found
    </div>
  </div>
</template>
