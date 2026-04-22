# Quickstart: API Reference Automation

This guide explains how to use and maintain the API reference automation system.

## Setup

The system requires `ts-morph` as a development dependency.

```bash
pnpm add -D ts-morph
```

## Running the Extractor

To manually regenerate the API reference JSON:

```bash
pnpm exec tsx scripts/extract-api-docs.ts
```

## Documentation Integration

The generated JSON is saved to `docs/public/api-reference.json`. In the Docus site, you can fetch this data in a Vue component:

```vue
<script setup>
const { data: apiRef } = await useFetch('/api-reference.json')
const myType = apiRef.value.ODataClientConfig
</script>

<template>
  <div v-if="myType">
    <h2>{{ myType.title }}</h2>
    <p>{{ myType.description }}</p>
    <!-- Render table from myType.properties -->
  </div>
</template>
```

## Maintenance

### Adding New Entry Points
Edit `scripts/extract-api-docs.ts` and add the new file path to the `ENTRY_POINTS` array.

### Updating Documentation
If you change a JSDoc comment in the source code, run the extractor script to update the JSON. Ensure the script is part of your CI/CD build pipeline to prevent drift.
