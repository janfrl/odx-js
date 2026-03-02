<script setup lang="ts">
const products = useOData('V2Service').entities('Products')

// Demonstrate OData query options: select specific fields and filter by price
const { data, pending, error, refresh, execute, status } = products.list({
  $select: ['ID', 'Name', 'Price', 'Currency'],
  $filter: 'Price gt 1000.00',
}, { immediate: false })

/**
 * Creates a new dummy product and triggers a refresh of the list.
 */
async function addItem(): Promise<void> {
  await products.create({
    Name: 'New Product',
    Price: '99.99',
    Currency: 'EUR',
  })
  refresh()
}

/**
 * Updates an existing product's name and price, then triggers a refresh.
 * @param {string} id The ID of the product to update.
 */
async function updateItem(id: string): Promise<void> {
  await products.update(id, {
    Name: 'Updated Product (Edited)',
    Price: '149.99',
  })
  refresh()
}

/**
 * Removes a product and triggers a refresh of the list.
 * @param {string} id The ID of the product to remove.
 */
async function deleteItem(id: string): Promise<void> {
  await products.remove(id)
  refresh()
}
</script>

<template>
  <UContainer class="py-8">
    <header class="border-b border-neutral-200 dark:border-neutral-800 pb-4 mb-8">
      <h1 class="text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
        Nuxt ODX Playground
      </h1>
      <p class="text-neutral-500 mt-2 flex items-center gap-2">
        Testing EntitySet abstraction: <UBadge color="neutral" variant="solid">
          V2Service/Products
        </UBadge>
      </p>
    </header>

    <div class="flex items-center gap-3 mb-8">
      <UButton icon="i-heroicons-play" color="primary" label="Execute Fetch" @click="execute" />
      <UButton icon="i-heroicons-plus" color="neutral" variant="soft" label="Create Product" @click="addItem" />
      <UButton icon="i-heroicons-arrow-path" color="neutral" variant="outline" label="Refresh" :disabled="status.value === 'idle'" @click="refresh" />
    </div>

    <div v-if="pending.value" class="space-y-4">
      <USkeleton class="h-12 w-full" />
      <USkeleton class="h-64 w-full" />
    </div>

    <UAlert
      v-else-if="error.value"
      icon="i-heroicons-exclamation-triangle"
      color="error"
      variant="subtle"
      title="Error loading data"
      :description="String(error.value)"
    />

    <div v-else-if="status.value === 'idle'" class="flex flex-col items-center justify-center py-20 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl bg-neutral-50/50 dark:bg-neutral-900/50">
      <UIcon name="i-heroicons-bolt" class="w-12 h-12 text-neutral-300 mb-4" />
      <p class="text-neutral-500 font-medium">
        No data loaded yet
      </p>
      <p class="text-neutral-400 text-sm mt-1">
        Click the "Execute Fetch" button to start
      </p>
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <UCard>
        <template #header>
          <div class="flex justify-between items-center">
            <span class="text-xs font-bold text-neutral-500 uppercase tracking-wider">UI Representation</span>
            <UBadge color="info" variant="subtle">
              {{ data.value?.length || 0 }} Items
            </UBadge>
          </div>
        </template>

        <ul class="divide-y divide-neutral-100 dark:divide-neutral-800 overflow-auto max-h-125 -m-4 sm:-m-6 px-4 sm:px-6">
          <li v-for="(product, index) in data.value" :key="product?.ID || index" class="py-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
            <div v-if="product" class="flex justify-between items-start">
              <div>
                <p class="font-medium text-neutral-900 dark:text-white">
                  {{ product.Name }}
                </p>
                <p class="text-xs text-neutral-500 mt-1">
                  ID: {{ product.ID || 'N/A' }}
                </p>
              </div>
              <div class="flex flex-col items-end gap-2">
                <div class="text-right">
                  <p class="font-semibold text-neutral-900 dark:text-white">
                    {{ product.Price }} {{ product.Currency }}
                  </p>
                </div>
                <div v-if="product.ID" class="flex items-center gap-2">
                  <UButton icon="i-heroicons-pencil" color="neutral" variant="ghost" size="xs" @click="updateItem(product.ID)" />
                  <UButton icon="i-heroicons-trash" color="error" variant="ghost" size="xs" @click="deleteItem(product.ID)" />
                </div>
              </div>
            </div>
          </li>
        </ul>
      </UCard>

      <UCard class="bg-neutral-900 dark:bg-neutral-950 border-neutral-800">
        <template #header>
          <span class="text-xs font-bold text-neutral-400 uppercase tracking-wider">Raw JSON Proxy Response</span>
        </template>
        <pre class="text-xs text-primary-400 overflow-auto max-h-125 font-mono -m-4 sm:-m-6 p-4 sm:p-6">{{ data.value }}</pre>
      </UCard>
    </div>
  </UContainer>
</template>
