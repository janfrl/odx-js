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
const { data: categoryContinuationPage } = await northwindCategories.listPage({
  $orderby: 'CategoryID',
  $select: ['CategoryID', 'CategoryName'],
  $top: 1,
})
const nextCategoryPage = categoryContinuationPage.value?.continuation
  ? await northwindCategories.fetchNextPage(categoryContinuationPage.value.continuation)
  : undefined
const { data: category } = await northwindCategories.get(1, {
  $select: ['CategoryID', 'CategoryName'],
})
const { data: relatedProducts } = await northwindCategories.listNavigation<{
  ProductID: number
  ProductName: string
}>(
  1,
  ['Products'],
  { $select: ['ProductID', 'ProductName'], $top: 1 },
)
const relatedProductResponse = await northwindCategories.fetchNavigationOneWithResponse<{
  ProductID: number
  ProductName: string
}>({
  source: 1,
  navigationPath: ['Products'],
  targetKey: 1,
  query: { $select: ['ProductID', 'ProductName'] },
})
const { data: relatedProductPage } = await northwindCategories.listNavigationPage<{
  ProductID: number
  ProductName: string
}>(
  1,
  ['Products'],
  { $orderby: 'ProductID', $select: ['ProductID', 'ProductName'], $top: 1 },
)
const nextRelatedProductPage = relatedProductPage.value?.continuation
  ? await northwindCategories.fetchNavigationNextPage<{
      ProductID: number
      ProductName: string
    }>(1, ['Products'], relatedProductPage.value.continuation)
  : undefined
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
  <div id="northwind-continuation-category">
    Northwind Continuation Category: {{ nextCategoryPage?.items[0]?.CategoryName ?? 'missing' }}
  </div>
  <div id="northwind-continuation-safe">
    Northwind Continuation Safe: {{ JSON.stringify(categoryContinuationPage).includes('private.northwind.example') ? 'false' : 'true' }}
  </div>
  <div id="northwind-category-detail">
    Northwind Category Detail: {{ category ? `${category.CategoryID} / ${category.CategoryName}` : 'missing' }}
  </div>
  <div id="northwind-related-product">
    Northwind Related Product: {{ relatedProducts[0]?.ProductName ?? 'missing' }}
  </div>
  <div id="northwind-related-product-response">
    Northwind Related Product Response: {{ relatedProductResponse.data.ProductName }} / {{ relatedProductResponse.etag ?? 'missing' }}
  </div>
  <div id="northwind-related-product-continuation">
    Northwind Related Product Continuation: {{ nextRelatedProductPage?.items[0]?.ProductName ?? 'missing' }}
  </div>
</template>
