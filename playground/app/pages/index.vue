<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
/**
 * Playground page for testing OData services with Nuxt UI components.
 */

const products = useOData('dummy').entities('Products')
const { data, pending, error, refresh } = await products.list()

/**
 * Adds a new item to the dummy service.
 */
async function addItem() {
  await products.create({ Name: 'New Product', Price: 99.99, Currency: 'EUR' })
  refresh()
}
</script>

<template>
  <UContainer class="py-10 space-y-8">
    <header class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold">
          Nuxt SAP OData
        </h1>
        <p class="text-muted-foreground">
          Testing EntitySet abstraction: <UKbd>dummy/Products</UKbd>
        </p>
      </div>

      <div class="flex gap-2">
        <UButton
          color="primary"
          icon="i-lucide-plus"
          @click="addItem"
        >
          Create Product
        </UButton>
        <UButton
          variant="outline"
          icon="i-lucide-refresh-cw"
          :loading="pending"
          @click="refresh"
        >
          Refresh
        </UButton>
      </div>
    </header>

    <UAlert
      v-if="error"
      color="error"
      variant="subtle"
      title="Error loading data"
      :description="String(error)"
      icon="i-lucide-circle-alert"
    />

    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h2 class="font-semibold">
            Result from Proxy
          </h2>
          <UBadge
            variant="subtle"
            color="neutral"
          >
            GET
          </UBadge>
        </div>
      </template>

      <div v-if="pending" class="space-y-4">
        <USkeleton class="h-4 w-[250px]" />
        <USkeleton class="h-20 w-full" />
      </div>

      <pre
        v-else
        class="text-xs overflow-auto max-h-[500px] p-4 bg-neutral-900 text-neutral-100 rounded-md"
      >{{ data }}</pre>
    </UCard>
  </UContainer>
</template>
