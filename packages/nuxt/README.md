# @me-tools/odx-nuxt

The official Nuxt module for the ODX ecosystem. It provides type-safe OData composables, automated SDK generation, and native DevTools integration.

## Installation

```bash
pnpm add @me-tools/odx-nuxt
```

## Reactive And Imperative Reads

Use `entitySet.list()` during component or page setup when Nuxt `AsyncData`
and SSR integration are desired. Use `entitySet.fetchList()` for later
controller events or other imperative effects:

```ts
const products = await useOData('Northwind').entitySet('Products').fetchList({ $top: 20 }, { signal })
```

Use `fetchOne()` for imperative key reads outside Nuxt `AsyncData` setup:

```ts
const product = await useOData('Northwind')
  .entitySet('Products')
  .fetchOne({ ID: 1, Locale: 'en' }, { $select: ['ID', 'Name'] }, { signal })
```

Read a related collection without constructing an OData resource path in the
consumer:

```ts
const relatedProducts = await useOData('Northwind')
  .entitySet('Products')
  .fetchNavigationList(1, 'Category/RelatedProducts', { $top: 20 }, { signal })
```

Contained rows use the same API with a structured source:

```ts
const item = {
  kind: 'contained-entity' as const,
  rootKey: 1,
  path: [{ navigationPath: ['Items'], key: 2 }],
}

const tags = await useOData('Northwind')
  .entitySet('Products')
  .fetchNavigationList(item, ['Tags'])
```

`entitySet.supportsContainedNavigationSources === true` is the explicit
runtime compatibility signal for structured sources such as nested contained
rows. Libraries integrating with ODX should require this marker instead of
inferring support from the presence of `fetchNavigationList`: older releases
exposed the same method name but interpreted its first argument only as an
entity key.

Create, update, and remove also accept request options for cancellation and
concurrency headers. Contained collection members retain their exact parent path;
`removeNavigation` deletes the addressed entity and is not a `$ref` unlink:

```ts
await useOData('Northwind')
  .entitySet('Products')
  .removeNavigation(1, ['Items'], { ItemID: 42 }, {
    headers: { 'If-Match': etag },
  })
```

`changeSet()` accepts `create-navigation`, `update-navigation`, and
`delete-navigation` mutations in addition to top-level updates, so related
entity edits can be committed atomically. Invoke qualified actions at the
service, collection, or entity binding path:

```ts
await useOData('Northwind').entitySet('Products').update(
  1,
  { Name: 'Updated' },
  { signal, headers: { 'If-Match': etag } },
)

await useOData('Northwind').entitySet('Products').invoke(
  'Northwind.ArchiveProduct',
  { key: 1, parameters: { Reason: 'obsolete' } },
  { signal },
)

const defaults = await useOData('Northwind').entitySet('Products').invokeFunction(
  'Northwind.GetProductDefaults',
  { parameters: { Locale: { type: 'Edm.String', value: 'en-US' } } },
  { signal },
)
```

## Verification

From the repository root:

```bash
pnpm --filter @me-tools/odx-nuxt run verify
```

This runs the Nuxt package generation/module e2e tests, then prepares the
minimal Nuxt playground and verifies the generated ODX service registry types
plus typed composable usage in the playground app.

For full documentation, getting started guides, and module configuration, see
the root documentation in this repository.

## Service Names And Generated Types

Generated registry declarations preserve the configured service name as the
registry key. Service names that are valid TypeScript identifiers can be used
with dot notation, for example `useOData().V2Service`. For names that are not
valid identifiers, use bracket or functional access instead, for example
`useOData()['Sales-Order']` or `useOData('Sales-Order')`.

Service names are also used in generated output and metadata cache paths, so
avoid path separator characters such as `/` and `\` in service names.

Registry generation parses each metadata file through `@me-tools/odx-metadata`
and projects entity sets through the core CSDL adapter before invoking the SDK
generator. Malformed metadata fails preparation with source-aware diagnostics
instead of producing a silently incomplete registry.
