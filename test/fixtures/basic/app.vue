<script setup lang="ts">
const northwindCategories = useOData('Northwind').entitySet('Categories')
const { data: categories } = await northwindCategories.list({
  $filter: 'CategoryID eq 1',
  $select: ['CategoryID', 'CategoryName'],
  $top: 1,
})
const { data: uncountedCategoryPage } = await northwindCategories.listPage({
  $filter: 'CategoryID eq 1',
  $select: ['CategoryID', 'CategoryName'],
  $top: 1,
})
const { data: categoryPage } = await northwindCategories.listPage({
  $filter: 'CategoryID eq 1',
  $inlinecount: 'allpages',
  $select: ['CategoryID', 'CategoryName'],
  $top: 1,
})
</script>

<template>
  <div id="northwind-category">
    Northwind Category: {{ categories?.[0]?.CategoryName ?? 'missing' }}
  </div>
  <div id="northwind-category-count">
    Northwind Category Count: {{ categoryPage?.totalCount ?? 'missing' }}
  </div>
  <div id="northwind-uncounted-category-page">
    Northwind Page Category: {{ uncountedCategoryPage?.items[0]?.CategoryName ?? 'missing' }}
  </div>
</template>
