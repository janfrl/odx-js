<script setup lang="ts">
import type { ODataServiceRegistry } from '@me-tools/odx-core'
import { useOData, useODataBasePath } from '#imports'

const minimalService: ODataServiceRegistry['MinimalLocal'] = useOData('MinimalLocal')
const products = minimalService.Products

const salesOrderService: ODataServiceRegistry['Sales-Order'] = useOData('Sales-Order')
const salesOrderProducts = salesOrderService.Products

const productList = products.list({
  $select: ['ID', 'Name'],
  $top: 1,
}, {
  immediate: false,
  server: false,
})

const salesOrderProductList = salesOrderProducts.list({
  $select: ['ID', 'Name'],
  $top: 1,
}, {
  immediate: false,
  server: false,
})

const basePath = useODataBasePath('MinimalLocal')
const salesOrderBasePath = useODataBasePath('Sales-Order')
</script>

<template>
  <main>
    <h1>Minimal ODX Nuxt playground</h1>
    <p>Service: MinimalLocal</p>
    <p>Base path: {{ basePath }}</p>
    <p>Request status: {{ productList.status }}</p>
    <p>Service: Sales-Order</p>
    <p>Base path: {{ salesOrderBasePath }}</p>
    <p>Request status: {{ salesOrderProductList.status }}</p>
  </main>
</template>
