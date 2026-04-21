<script setup lang="ts">
const props = defineProps<{
  name: string
}>()

// In a real app, this would be loaded from metadata.json
// For this MVP, we provide some defaults if not found
const metadata = {
  ModuleOptions: {
    title: 'Module Options',
    description: 'Configuration options for the ODX Nuxt module.',
    properties: [
      { name: 'basePath', type: 'string', default: '/api/odx', description: 'The URL prefix where the proxy handlers are mounted.' },
      { name: 'mode', type: '"sdk"', default: 'sdk', description: 'The generation mode.' },
      { name: 'services', type: 'ODataServiceConfig[]', default: '[]', description: 'List of OData services to configure.' },
      { name: 'forwardAuthHeader', type: 'boolean', default: 'true', description: 'Whether to forward the Authorization header to the OData backend.' },
    ],
  },
  ODataServiceConfig: {
    title: 'Service Configuration',
    description: 'Configuration for an individual OData service.',
    properties: [
      { name: 'name', type: 'string', required: true, description: 'Unique identifier for the service.' },
      { name: 'url', type: 'string', required: true, description: 'URL to the service root or path to an EDMX file.' },
      { name: 'strategy', type: '"proxied" | "direct"', default: 'proxied', description: 'Whether to use the server-side proxy or direct browser requests.' },
    ],
  },
}

const item = metadata[props.name]
</script>

<template>
  <div v-if="item" class="my-8">
    <h3 class="text-xl font-bold mb-2">
      {{ item.title }}
    </h3>
    <p class="text-gray-600 dark:text-gray-400 mb-4">
      {{ item.description }}
    </p>

    <div class="overflow-x-auto">
      <table class="min-w-full border-collapse border border-gray-200 dark:border-gray-800">
        <thead>
          <tr class="bg-gray-50 dark:bg-gray-900">
            <th class="px-4 py-2 text-left border border-gray-200 dark:border-gray-800">
              Property
            </th>
            <th class="px-4 py-2 text-left border border-gray-200 dark:border-gray-800">
              Type
            </th>
            <th class="px-4 py-2 text-left border border-gray-200 dark:border-gray-800">
              Default
            </th>
            <th class="px-4 py-2 text-left border border-gray-200 dark:border-gray-800">
              Description
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="prop in item.properties" :key="prop.name" class="border border-gray-200 dark:border-gray-800">
            <td class="px-4 py-2 font-mono text-sm">
              {{ prop.name }}
              <span v-if="prop.required" class="text-red-500">*</span>
            </td>
            <td class="px-4 py-2 font-mono text-xs text-primary-600 dark:text-primary-400">
              {{ prop.type }}
            </td>
            <td class="px-4 py-2 font-mono text-xs text-gray-500">
              {{ prop.default || '-' }}
            </td>
            <td class="px-4 py-2 text-sm">
              {{ prop.description }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
  <div v-else class="p-4 border border-red-200 bg-red-50 text-red-700 rounded">
    Metadata for <strong>{{ name }}</strong> not found.
  </div>
</template>
