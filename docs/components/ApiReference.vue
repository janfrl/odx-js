<script setup lang="ts">
interface Property {
  name: string
  type: string
  default?: string
  required?: boolean
  description: string
}

interface MetadataItem {
  title: string
  description: string
  properties: Property[]
}

const props = defineProps<{
  name: string
}>()

// In a real app, this would be loaded from metadata.json
const metadata: Record<string, MetadataItem> = {
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

    <div class="overflow-x-auto my-6">
      <prose-table>
        <prose-thead>
          <prose-tr>
            <prose-th>Property</prose-th>
            <prose-th>Type</prose-th>
            <prose-th>Default</prose-th>
            <prose-th>Description</prose-th>
          </prose-tr>
        </prose-thead>
        <prose-tbody>
          <prose-tr v-for="prop in item.properties" :key="prop.name">
            <prose-td>
              <code>{{ prop.name }}</code>
              <span v-if="prop.required" class="text-red-500 ml-1">*</span>
            </prose-td>
            <prose-td>
              <code>{{ prop.type }}</code>
            </prose-td>
            <prose-td>
              <code v-if="prop.default">{{ prop.default }}</code>
              <span v-else>-</span>
            </prose-td>
            <prose-td class="text-sm">
              {{ prop.description }}
            </prose-td>
          </prose-tr>
        </prose-tbody>
      </prose-table>
    </div>
  </div>
  <div v-else class="p-4 border border-red-200 bg-red-50 text-red-700 rounded">
    Metadata for <strong>{{ name }}</strong> not found.
  </div>
</template>
