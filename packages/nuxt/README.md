# @me-tools/odx-nuxt

The official Nuxt module for the ODX ecosystem. It provides type-safe OData composables, automated SDK generation, and native DevTools integration.

Nuxt auto-imports `useOData` in application code. Nitro server routes use
explicit request-context-aware read and mutation services instead of rebuilding
proxy paths or calling an upstream origin directly:

```ts
import { createODataServerReadService } from '@me-tools/odx-nuxt/server'

export default defineEventHandler(async (event) => {
  const catalog = createODataServerReadService(event, 'catalog')
  return catalog.entitySet('Products').fetchPage({
    $select: ['ID', 'Name'],
    $top: 30,
    $count: true,
  })
})
```

The server read service invokes unbound V4 functions directly at the configured
service root. Its entity set provides `fetchOne`, `fetchOneWithResponse`,
`fetchContainedOneWithResponse`, `fetchNavigationOneWithResponse`, `fetchList`,
`fetchPage`, `fetchNextPage`, `fetchNavigationList`, `fetchNavigationPage`,
`fetchNavigationNextPage`, and typed `invokeFunction` operations. Exact entity
response variants preserve the entity and its optional ETag for conditional
follow-up mutations. All methods validate structured entity and navigation
identities. Page reads retain server-driven count and continuation metadata;
continuation methods anchor the opaque token to the same validated
request-scoped proxy path and never follow a backend-owned URL.

Use the `WithResponse` variants when the host must retain an optional
representation, next ETag, response identity, location, or SAP message. The
mutation service invokes unbound V4 actions at the service root, including a
response-aware variant. Its entity-set service exposes request-scoped `create`,
`update`, `remove`, and `invoke` operations together with their response-aware
counterparts. Entity-set actions support collection, entity, and navigation
bindings. SAP Gateway V2 handlers can explicitly select `merge` or
`mergeWithResponse` for root entities and the corresponding structured
navigation methods; the service never silently substitutes MERGE for PATCH. The
same service provides structured `createNavigation`,
`updateNavigation`, and
`removeNavigation` operations, including response-aware variants, without
requiring an application endpoint to serialize parent or related keys. It also
provides binary `createMedia`, `createNavigationMedia`, `fetchMedia`, and
`updateMedia` operations without placing bytes in Nuxt's SSR payload. Creates
post an initial default stream to the validated entity set or structured
navigation collection and retain the representation, ETag, entity ID, location,
and SAP message advertised by the service. Reads and replacements address
default or named streams. All methods use the configured ODX proxy route and
the current Nitro request context rather than calling an upstream origin.

For atomic V2 updates, the request-scoped service advertises
`supportsV2AtomicChangesets === true` and exposes `v2ChangeSet`. It accepts only
typed root and navigation updates as `MERGE`. Runtimes that additionally expose
`supportsV2AtomicNavigationMutations === true` accept structured navigation
creates as `POST` and deletes as `DELETE` in the same changeset. Every path is
derived from structured keys, and SAP Gateway V2 version headers remain owned
by ODX. Runtimes advertising `supportsV2AtomicNavigationReferences === true`
also accept direct relationship link and unlink members through V2 `$links`;
link bodies use the canonical `{ "uri": "Set(key)" }` representation. Unsupported
or multi-segment reference shapes fail before request-scoped proxy transport.

```ts
const catalog = createODataServerMutationService(event, 'catalog')
const documents = catalog.entitySet('Documents')
const created = await documents.createMedia(bytes, {
  contentType: 'application/pdf',
  slug: 'manual.pdf',
})
```

For an OData V2 service operation, invoke the metadata-declared FunctionImport
on the request-scoped mutation service. Parameters remain typed structured data;
ODX serializes them as V2 URI literals at the service root and sends no JSON body:

```ts
const legacy = createODataServerMutationService(event, 'legacyCatalog')
const approved = await legacy.invokeFunctionImport('ApproveProduct', {
  method: 'POST',
  parameters: {
    ID: { type: 'Edm.Int32', value: 1 },
    Reason: { type: 'Edm.String', value: 'reviewed' },
  },
}, { signal })
```

The explicit `supportsV2FunctionImports` capability and the same fail-closed
name, method, primitive-type, and value validation as the browser service prevent
Nitro handlers from constructing a parallel service-operation URL.

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
`supportsNavigationRootReferences === true` separately advertises
`createNavigationRootReference(source, path)`. It returns the validated
service-relative `$root/...` identity of that exact related collection for
query expressions; it performs no request and never exposes a service origin.

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
For a related entity, `fetchNavigationOneWithResponse({ source,
navigationPath, targetKey?, query? }, options?)` preserves the same flattened
entity and ETag contract. Omit `targetKey` for a single-valued navigation or
provide it for one member of a related collection. Runtime clients advertise
this additive API with `supportsNavigationEntityResponses === true`.
For an exact contained entity address, use
`fetchContainedOneWithResponse(source, query?, options?)`. The source keeps the
root key and every containment segment structured; collection-valued segments
carry a child key while to-one segments omit the key predicate from the
canonical resource path. Runtime clients expose this read only with
`supportsContainedEntityResponses === true`.
On SSR, response-aware methods retain Nitro's active request context while
using the raw response path, so relative proxy calls preserve both request
scoping and response validators.
The same capability exposes `updateNavigationWithResponse` for a keyed
collection child or a single-valued related entity, preserving its optional
representation and next ETag.
Response-aware create, PATCH, MERGE, DELETE, and action methods also retain the legacy
SAP Gateway `sap-message` header as `sapMessage`; semantic consumers remain
responsible for parsing its JSON message shape.

Use `invokeWithResponse` on the service or an entity set when an action's
optional representation, response ETag, SAP feedback, or advertised `Location`
is significant. A location can survive a bodyless response; the application
owns any follow-up request and must not treat its presence as proof of completion.
Unbound, collection-, entity-, and navigation-bound addressing stays identical
to `invoke`; the existing body-only method remains source-compatible.

Use `removeWithResponse` or `removeNavigationWithResponse` when a DELETE's
optional body, response ETag, or SAP feedback is significant. Runtime entity
sets advertise this with `supportsDeleteResponses === true`; `remove` and
`removeNavigation` remain the source-compatible body-only paths.

For creates that request a minimal response, retain the advertised entity
identity and validator explicitly:

```ts
const created = await useOData('Northwind').entitySet('Products').createWithResponse(
  { Name: 'Created' },
  { headers: { Prefer: 'return=minimal' } },
)

// created.data may be absent; entityId, location, and etag are optional.
```

Runtime entity sets expose `supportsCreateResponses === true`. The existing
`create()` method remains the body-only convenience path.
`createNavigationWithResponse(source, path, body, options)` provides the same
response contract for a related collection below a root or contained parent.
The request-scoped Nitro mutation service exposes the same structured
navigation create, update, and delete families. They retain the current Nitro
request context while deriving collection, to-one, and keyed to-many targets
from the parent source, navigation path, and optional related key.

For SAP Gateway OData V2 services that require the legacy update verb, use
`merge()` or `mergeWithResponse()` explicitly. PATCH remains the default
`update()` behavior; ODX never changes the verb implicitly. Runtime entity sets
advertise this separate capability with `supportsMerge === true`. ODX Core
serializes MERGE record bodies explicitly as JSON so the same payload reaches
browser proxy, direct Node, and Fetch-compatible transports.
For a related entity, negotiate `supportsNavigationMerge === true` and call
`mergeNavigation()` or `mergeNavigationWithResponse()` with a structured
parent source, navigation path, and optional target key. The response-aware
variant retains the next ETag; neither method changes the existing PATCH
navigation contract.

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

const contained = await files.createNavigationMedia(
  { ID: 42, IsActiveEntity: false },
  ['Attachments'],
  pdfBytes,
  {
    contentType: 'application/pdf',
    slug: 'manual.pdf',
  },
)

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
replacement ETag plus allowlisted SAP Gateway feedback when present. Media
creates preserve the same optional `sapMessage` field alongside their
representation and ETag, plus `entityId` and `location` when advertised by the
service. These identity fields remain available even for a valid bodyless
create. Named stream properties remain validated
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

`createNavigationMedia` applies the same binary, header, representation, and
ETag contract to a validated collection-valued navigation below a root or
contained parent. The caller supplies a structured parent source plus explicit
navigation segments; ODX does not infer containment or collection cardinality
from CSDL.

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

const linked = await categories.linkNavigationWithResponse(
  1,
  ['Categories'],
  'Categories',
  7,
  { headers: { 'If-Match': etag } },
)

const unlinked = await categories.unlinkNavigationWithResponse(
  1,
  ['Categories'],
  7,
  { headers: { 'If-Match': linked.etag ?? '*' } },
)
```

Runtime entity sets advertise this contract with
`supportsNavigationReferences === true`. Metadata-aware integrations should
require both that marker and a proven non-contained navigation before exposing
relationship editing. Response-aware relationship writes retain an optional
representation, ETag, and `sap-message` as `sapMessage`; clients advertise
them separately through `supportsNavigationReferenceResponses === true` on
the universal client. The request-scoped Nitro mutation service exposes the
same payload-only and response-aware relationship operations without leaking
the configured upstream origin into an application endpoint.

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
For SAP Gateway V2, `v2ChangeSet()` atomically combines root updates and
structured navigation updates, creates, or deletes. Updates use `MERGE`, creates
use `POST`, deletes use `DELETE`, and every member retains its own headers.
Require `supportsV2AtomicChangesets === true` for the update contract and
`supportsV2AtomicNavigationMutations === true` before sending create or delete
members. Require `supportsV2AtomicNavigationReferences === true` before sending
direct `link-navigation` or `unlink-navigation` members; ODX serializes these
through V2 `$links` rather than V4 `$ref`. Unsupported V2 mutation kinds are not
converted to V4 `PATCH` or split into separate writes.
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

const approved = await useOData('Northwind').invokeFunctionImport(
  'ApproveProduct',
  {
    method: 'POST',
    parameters: {
      ID: { type: 'Edm.Int32', value: 1 },
      Reason: { type: 'Edm.String', value: 'reviewed' },
    },
  },
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

OData V2 FunctionImports are service-root operations rather than V4 bound
actions. `invokeFunctionImport` therefore requires the metadata-declared HTTP
method and serializes its typed primitive parameters as V2 URI query literals,
including for `POST`; it never sends them as a JSON action body. Invalid names,
types, and values fail before a request is made.

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
