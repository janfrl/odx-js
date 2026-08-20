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

Use the page variants when a List Report needs the backend count. The explicit
object shape remains intact in Nuxt SSR payloads:

```ts
const { data: page } = await useOData('Northwind')
  .entitySet('Products')
  .listPage({ $inlinecount: 'allpages', $top: 20 })

// page.value?.items, page.value?.totalCount, and page.value?.continuation
```

`fetchPage()` is the imperative equivalent. OData V4 services use
`{ $count: true }` instead of `$inlinecount`.
When the backend returns a V2 `__next` or V4 `@odata.nextLink`, continue on the
same entity set without exposing or following the backend URL:

```ts
const first = await useOData('Northwind').entitySet('Products').fetchPage({ $top: 20 })
const second = first.continuation
  ? await useOData('Northwind').entitySet('Products').fetchNextPage(first.continuation)
  : undefined
```

The continuation is an opaque, exactly preserved query component. ODX anchors
it to the caller-owned entity-set path; applications must not parse, edit, or
construct continuation tokens themselves. This protects the typed client
boundary. A raw proxy response remains the backend wire representation and can
still contain an absolute next-link URL.
`entitySet.supportsCollectionPages === true` is the explicit runtime signal
for this additive capability; the original `ODataEntitySet` structural
contract remains unchanged.
`supportsContinuations === true` identifies the separate continuation
capability. Generated Nuxt service declarations use `ODataRuntimeService`,
which combines the additive merge, response, count, and continuation contracts;
the base `ODataService` contract remains valid for existing implementations.
The same capability covers related collections through
`listNavigationPage()`, `fetchNavigationPage()`,
`listNavigationNextPage()`, and `fetchNavigationNextPage()`. ODX anchors those
tokens to the validated parent key and navigation path.

Use `fetchOne()` for imperative key reads outside Nuxt `AsyncData` setup:

```ts
const product = await useOData('Northwind')
  .entitySet('Products')
  .fetchOne({ ID: 1, Locale: 'en' }, { $select: ['ID', 'Name'] }, { signal })
```

When the next mutation must be conditional, use the explicit response read.
It returns the flattened entity plus only its ETag concurrency validator;
arbitrary response headers remain private:

```ts
const { data: product, etag } = await useOData('Northwind')
  .entitySet('Products')
  .fetchOneWithResponse(1, { $select: ['ID', 'Name'] }, { signal })

const updated = await useOData('Northwind').entitySet('Products').updateWithResponse(
  product.ID,
  { Name: 'Updated' },
  { headers: etag ? { 'If-Match': etag } : undefined },
)

// updated.etag is the next validator; updated.data is absent after a valid 204.
```

The HTTP `ETag` header takes precedence. OData V4 `@odata.etag` and V2
`__metadata.etag` are used only as compatibility fallbacks when the header is
absent. Existing `get()` and `fetchOne()` remain body-only.
`entitySet.supportsEntityResponses === true` is the explicit runtime
read capability signal. `supportsOptimisticConcurrency === true` identifies
the separate conditional-mutation response capability, without widening the
existing structural service contracts.

For SAP Gateway OData V2 services that require the legacy update verb, use
`merge()` or `mergeWithResponse()` explicitly. PATCH remains the default
`update()` behavior; ODX never changes the verb implicitly. Runtime entity sets
advertise this separate capability with `supportsMerge === true`.

Read or replace a media entity's default stream, or a named `Edm.Stream`
property, without constructing a `$value` URL:

```ts
const files = useOData('Documents').entitySet('Files')
const current = await files.fetchMedia(42)
const preview = await files.fetchMedia(42, { streamProperty: 'Preview' })

const created = await files.createMedia(pdfBytes, {
  contentType: 'application/pdf',
  slug: 'manual.pdf',
})

await files.updateMedia(42, preview.data, {
  contentType: preview.contentType ?? 'application/octet-stream',
  headers: current.etag ? { 'If-Match': current.etag } : undefined,
})

const attachment = {
  kind: 'contained-entity' as const,
  rootKey: { ID: 42, IsActiveEntity: false },
  path: [{ navigationPath: ['Attachments'], key: 7 }],
}
await files.updateMedia(attachment, replacementBytes, {
  contentType: 'application/pdf',
  streamProperty: 'Content',
})
```

These methods are imperative because binary payloads should not enter Nuxt's
JSON SSR payload. `fetchMedia` returns an `ArrayBuffer` and optional
`contentType`, `contentDisposition`, and `etag` response metadata.
`updateMedia` uses `PUT`, requires an explicit valid media type, and returns a
replacement ETag when present. Named stream properties remain validated
identifier segments. Root keys and structured contained-entity sources share
the same path-safe media contract; callers never concatenate containment or
`$value` paths. Runtime entity sets advertise this additive contract with
`supportsMediaStreams === true`; contained callers additionally require
`supportsContainedNavigationSources === true`.

`createMedia` uses `POST` on the validated entity collection, requests the
created representation, and returns it with the response ETag when supplied by
the service. Its optional `slug` becomes the OData `Slug` header after rejecting
empty values and header injection. Caller headers cannot override the validated
`Content-Type`, `Prefer`, or `Slug` values.

ODX does not infer stream properties from metadata or provide attachment UI.
Browser applications should use the Nuxt proxy so authenticated requests and
SAP CSRF handling stay server-side; higher layers own file selection,
progress, preview, and renderer semantics.

Read a related collection without constructing an OData resource path in the
consumer:

```ts
const relatedProducts = await useOData('Northwind')
  .entitySet('Products')
  .fetchNavigationList(1, 'Category/RelatedProducts', { $top: 20 }, { signal })
```

During page setup, use `listNavigation<TResult>()` for typed Nuxt AsyncData and
SSR integration. The explicit result type models the related entity rather
than incorrectly reusing the parent entity-set type:

```ts
const { data: relatedProducts } = await useOData('Northwind')
  .entitySet('Categories')
  .listNavigation<Product>(1, ['Products'], { $top: 20 })
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

Use the separate relationship methods when the target entity already exists.
They preserve entity-set names and keys as structured values until ODX creates
the service-relative reference. `unlinkNavigation` removes only the relationship:

```ts
const categories = useOData('Northwind').entitySet('Products')
await categories.linkNavigation(1, ['Categories'], 'Categories', 7)
await categories.unlinkNavigation(1, ['Categories'], 7)
```

Runtime entity sets advertise this contract with
`supportsNavigationReferences === true`. Metadata-aware integrations should
require both that marker and a proven non-contained navigation before exposing
relationship editing.

`changeSet()` accepts service-, collection-, and entity-bound `action` members,
`create-navigation`, `update-navigation`, `delete-navigation`,
`link-navigation`, and `unlink-navigation` mutations in addition to top-level
updates. A binary `update-media` member derives an entity or named-stream
`$value` target from structured inputs, so it can be paired with a root update
for atomic stream, file-name, and media-type changes without concatenating a
resource path. The service advertises this additive binary contract through
`supportsAtomicMediaChangesets === true`.

The action-member extension is advertised separately through
`supportsAtomicActionChangesets === true`, allowing integrations to stay
fail-closed with older ODX runtimes.

`batchChangeSets()` sends ordered mutation groups as separate changesets inside
one batch and returns a `succeeded` result per group, preserving partial success.
Use `supportsBatchChangeSets === true` before depending on this newer contract.
Invoke qualified actions at the
service, collection, entity, or navigation binding path. Keyed contained
entities use the same structured source as navigation reads and mutations, so
callers never concatenate executable resource paths:

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

await useOData('Northwind').entitySet('Products').invoke(
  'Northwind.SetPriority',
  { key: 1, parameters: { Priority: 'Urgent' } },
)

await useOData('Northwind').entitySet('Products').invoke(
  'Northwind.RepriceItem',
  {
    key: {
      kind: 'contained-entity',
      rootKey: 1,
      path: [{ navigationPath: ['Items'], key: 42 }],
    },
    parameters: { Percent: 5 },
  },
)

const defaults = await useOData('Northwind').entitySet('Products').invokeFunction(
  'Northwind.GetProductDefaults',
  { parameters: { Locale: { type: 'Edm.String', value: 'en-US' } } },
  { signal },
)
```

OData enumeration parameters use their declared member-name representation in
the JSON action body (`"Urgent"` above). ODX preserves that string exactly and
does not replace it with the member's underlying integer value; metadata-aware
callers remain responsible for validating the member against the EnumType.

Structured action parameters remain nested JSON objects with exact property
names and explicit `null` values. ODX does not flatten or stringify them;
metadata-aware callers remain responsible for validating the complex contract.

## Verification

From the repository root:

```bash
pnpm --filter @me-tools/odx-nuxt run verify
```

This runs the Nuxt package generation/module e2e tests, then prepares the
minimal Nuxt playground and verifies the generated ODX service registry types
plus typed composable usage in the playground app.

The normal package suite includes a checked-in Northwind V2 compatibility
fixture. It verifies generated service typing, bounded query forwarding, JSON
content negotiation, V2 envelope normalization, and SSR-safe inline count
projection without network access.

The public Northwind service smoke is intentionally separate from `verify`:

```bash
pnpm --filter @me-tools/odx-nuxt run test:live:northwind
```

It fetches the V2 and V4 service metadata and performs equivalent bounded,
filtered Categories reads through the Nuxt server proxy. The assertion proves
that both response envelopes normalize to the same canonical sample entity.
The command is an opt-in observation of a public, read-only demo service; it is
not a CI gate or evidence of SAP/BTP/Fiori compatibility.

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
