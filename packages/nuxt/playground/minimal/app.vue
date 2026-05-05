<script setup lang="ts">
import type { ODataServiceRegistry } from '@bc8-odx/core'
import { useOData, useODataBasePath } from '#imports'

const minimalService: ODataServiceRegistry['MinimalLocal'] = useOData('MinimalLocal')
const products = minimalService.Products

const productList = products.list({
  $select: ['ID', 'Name'],
  $top: 1,
}, {
  immediate: false,
  server: false,
})

const basePath = useODataBasePath('MinimalLocal')
</script>

<template>
  <main>
    <h1>Minimal ODX Nuxt playground</h1>
    <p>Service: MinimalLocal</p>
    <p>Base path: {{ basePath }}</p>
    <p>Request status: {{ productList.status }}</p>
  </main>
</template>
