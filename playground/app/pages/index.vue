<script setup lang="ts">
import { useOData } from '#imports'

const products = useOData('V2Service').entities('Products')

const { data, pending, error, refresh } = await products.list()

/**
 * Creates a new dummy product and triggers a refresh of the list.
 */
async function addItem(): Promise<void> {
  await products.create({
    Name: 'New Product',
    Price: 99.99,
    Currency: 'EUR',
  })
  refresh()
}
</script>

<template>
  <UContainer class="py-8">
    <header class="border-b border-gray-200 dark:border-gray-800 pb-4 mb-8">
      <h1 class="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
        Nuxt ODX Playground
      </h1>
      <p class="text-gray-500 mt-2 flex items-center gap-2">
        Testing EntitySet abstraction: <UBadge color="neutral" variant="solid">
          dummy/Products
        </UBadge>
      </p>
    </header>

    <div class="flex items-center gap-3 mb-8">
      <UButton icon="i-heroicons-plus" color="primary" label="Create Product" @click="addItem" />
      <UButton icon="i-heroicons-arrow-path" color="neutral" variant="outline" label="Refresh" @click="refresh" />
    </div>

    <div v-if="pending" class="space-y-4">
      <USkeleton class="h-12 w-full" />
      <USkeleton class="h-64 w-full" />
    </div>

    <UAlert
      v-else-if="error"
      icon="i-heroicons-exclamation-triangle"
      color="error"
      variant="subtle"
      title="Error loading data"
      :description="String(error)"
    />

    <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <UCard>
        <template #header>
          <div class="flex justify-between items-center">
            <span class="text-xs font-bold text-gray-500 uppercase tracking-wider">UI Representation</span>
            <UBadge color="info" variant="subtle">
              {{ data?.length || 0 }} Items
            </UBadge>
          </div>
        </template>

        <ul class="divide-y divide-gray-100 dark:divide-gray-800 overflow-auto max-h-[500px] -m-4 sm:-m-6 px-4 sm:px-6">
          <li v-for="(product, index) in data" :key="product.ID || index" class="py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
            <div class="flex justify-between items-start">
              <div>
                <p class="font-medium text-gray-900 dark:text-white">
                  {{ product.Name }}
                </p>
                <p class="text-xs text-gray-500 mt-1">
                  ID: {{ product.ID || 'N/A' }}
                </p>
              </div>
              <div class="text-right">
                <p class="font-semibold text-gray-900 dark:text-white">
                  {{ product.Price }} {{ product.Currency }}
                </p>
              </div>
            </div>
          </li>
        </ul>
      </UCard>

      <UCard class="bg-gray-900 dark:bg-gray-950 border-gray-800">
        <template #header>
          <span class="text-xs font-bold text-gray-400 uppercase tracking-wider">Raw JSON Proxy Response</span>
        </template>
        <pre class="text-xs text-emerald-400 overflow-auto max-h-[500px] font-mono -m-4 sm:-m-6 p-4 sm:p-6">{{ data }}</pre>
      </UCard>
    </div>
  </UContainer>
</template>
