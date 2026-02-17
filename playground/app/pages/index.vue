<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
// Accessing the actual entity set from dummy.edmx
const example = useOData('dummy').entities('ExampleEntities')

const { data, pending, error, refresh } = await example.list()

async function addItem() {
  // POST request to /api/sap-odata/dummy/ExampleEntities
  await example.create({ Name: 'New Example' })
  refresh()
}
</script>

<template>
  <div class="p-4 space-y-4">
    <header>
      <h1 class="text-2xl font-bold text-slate-800">
        Nuxt SAP OData
      </h1>
      <p class="text-sm text-slate-500">
        Testing EntitySet abstraction: <code>dummy/ExampleEntities</code>
      </p>
    </header>

    <div class="flex items-center gap-2">
      <button
        class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors"
        @click="addItem"
      >
        Create Product
      </button>
      <button
        class="px-4 py-2 border border-slate-300 hover:bg-slate-50 rounded-md transition-colors"
        @click="refresh"
      >
        Refresh
      </button>
    </div>

    <div
      v-if="pending"
      class="animate-pulse flex space-x-4"
    >
      <div class="flex-1 space-y-4 py-1">
        <div class="h-4 bg-slate-200 rounded w-3/4" />
        <div class="space-y-2">
          <div class="h-4 bg-slate-200 rounded" />
          <div class="h-4 bg-slate-200 rounded w-5/6" />
        </div>
      </div>
    </div>

    <div
      v-else-if="error"
      class="p-4 bg-red-50 border border-red-200 text-red-700 rounded-md"
    >
      <p class="font-bold">
        Error loading data
      </p>
      <pre class="text-xs mt-2">{{ error }}</pre>
    </div>

    <div
      v-else
      class="bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden"
    >
      <div class="px-4 py-2 bg-slate-50 border-b border-slate-200 text-xs font-mono text-slate-600">
        Result from Proxy
      </div>
      <pre class="p-4 text-xs overflow-auto max-h-[400px]">{{ data }}</pre>
    </div>
  </div>
</template>
