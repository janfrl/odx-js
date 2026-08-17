<script setup lang="ts">
const { data: categories } = await useOData('Northwind')
  .entitySet('Categories')
  .list({
    $filter: 'CategoryID eq 1',
    $select: ['CategoryID', 'CategoryName'],
    $top: 1,
  })
</script>

<template>
  <div id="northwind-category">
    Northwind Category: {{ categories?.[0]?.CategoryName ?? 'missing' }}
  </div>
</template>
