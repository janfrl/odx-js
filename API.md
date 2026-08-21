# API

This file summarizes the durable public and internal contracts. Detailed user
guides and generated type reference live in `docs/content`.

## Metadata Package

`@me-tools/odx-metadata` is the experimental framework-neutral CSDL ingestion
boundary. Its primary functions are:

- `parseCsdl(input, options)` for XML/JSON format detection
- `parseCsdlXml(source, options)` and `parseCsdlJson(source, options)` for explicit representations
- `walkCsdlNodes`, `findCsdlNode`, and representation-specific lookup helpers
- `resolveCsdlNullable` for the distinct XML and JSON defaults
- `serializeCsdlDocument` and `canonicalizeCsdlDocument`
- `hashCsdlSource`, `hashCsdlDocument`, and `createCsdlArtifact`

A successful parse returns a versioned `CsdlDocument`; a failed parse returns
`document: null` with structured diagnostics. Unknown OData versions remain
`unknown`. Raw input is opt-in, and parsed JSON object input reports that token
locations, duplicate keys, and original numeric lexemes are unavailable.

`documentHash` identifies the versioned canonical document. `sourceHash`
identifies supplied UTF-8 string data or exact `Uint8Array` bytes. Neither is a
standards-defined CSDL signature. See `packages/metadata/README.md` for current
conformance limits and non-goals.

## Core Package

`@me-tools/odx-core` exposes framework-neutral OData request utilities.
`formatODataKey`, `createODataEntityPath`, `createODataEntityReference`,
`createODataNavigationRootReference`, `formatODataNavigationPath`, and
`joinODataPath` provide validated, transport-neutral OData resource-path and
relationship-reference construction. The navigation-root helper identifies an
exact related collection below a structured entity or containment source
without duplicating key serialization in higher layers.
`validateODataIdentifier` and `validateODataQualifiedName` reject
path-altering entity, key-field, navigation, and action names before transport.
`serializeODataChangeSet(requests, options?)` creates one OData V4 multipart
batch containing an atomic changeset. Each non-GET operation retains its
service-relative path, JSON body, headers, and unique Content-ID. Unsafe
absolute paths, control characters, empty sets, and invalid or duplicate MIME
boundaries fail before transport.

`serializeODataBatchChangeSets(changeSets, options?)` emits multiple independent
changesets in one batch with unique boundaries and Content-IDs. Its paired
`parseODataBatchChangeSetsResponse(body, contentType)` preserves one immutable
result per changeset, including non-2xx outcomes, so one rejected group does not
erase successful sibling groups.

`parseODataChangeSetResponse(body, contentType)` validates nested multipart or
single-error batch responses and returns immutable per-operation status,
headers, and parsed body values. Any non-2xx member throws
`ODataChangeSetError` with the complete parsed response set; an outer HTTP 200
alone is never interpreted as mutation success.

The contract follows OData 4.01 Part 1, sections 11.7.2 and 11.7.3. It
contains no Nuxt, Node.js, or transport behavior.

The `@me-tools/odx-core/server` entry accepts loss-aware metadata documents
through `detectODataVersionFromCsdlDocument`,
`extractEntitiesFromCsdlDocument`, and
`extractAssociationsFromCsdlDocument`. These functions provide the established
core projection without reparsing XML. File-based EDMX helpers remain available
for compatibility during migration.

## Nuxt Module

Install and register `@me-tools/odx-nuxt` in `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: ['@me-tools/odx-nuxt'],
  odata: {
    services: [
      {
        name: 'Northwind',
        url: 'https://services.odata.org/V2/Northwind/Northwind.svc',
        route: 'northwind',
        strategy: 'proxied',
      },
    ],
  },
})
```

The module config key is `odata`.

### Module Options

Stable options are defined in `packages/core/src/types.ts` as `ModuleOptions`.

| Option | Purpose | Default |
| --- | --- | --- |
| `basePath` | Nitro route prefix for proxied OData calls. | `/api/odx` |
| `mode` | Generation mode. Currently `sdk`. | `sdk` |
| `defaultProxyMode` | Default proxy response handling mode. | `stream` |
| `destination` | Global SAP BTP destination fallback. | none |
| `auth` | Global Basic, Bearer, or mock auth data. | none |
| `headers` | Global headers merged into outgoing proxy calls. | none |
| `rejectUnauthorized` | TLS certificate validation for metadata/backend calls. | `true` |
| `forwardAuthHeader` | Forward incoming Authorization header through ODX. | `true` |
| `services` | Configured OData service definitions. | `[]` |
| `btpConfigService` | User-provided service name for BTP config overrides. | `odx-config` |
| `security.sapXsuaa` | Load SAP XSUAA validation in a Node.js Nitro host. Keep disabled for portable edge targets. | `false` |
| `telemetry.enabled` | Publish privacy-safe completed-request summaries through the host hook. | `false` |
| `devtools.enabled` | Enable the Explorer in Nuxt DevTools during development. | `true` |
| `devtools.maxLogs` | Maximum in-memory traffic log entries. | `100` |
| `devtools.logPayloads` | Store bounded request/response payload previews in development traffic logs. | `true` |
| `devtools.maxPayloadBytes` | Maximum serialized bytes kept per logged request/response payload before replacing it with a truncated preview marker. | `32768` |
| `devtools.logStore.provider` | Traffic log storage provider: `memory` or `sql`. SQL storage is implemented inside the proxy through db0. | `memory` |
| `devtools.logStore.sql.connector` | Persistent SQL connector for traffic logs: `postgresql` or `sqlite`. Inferred from URL/path when possible. | none |
| `devtools.logStore.sql.url` | Database URL for network SQL providers such as PostgreSQL. | none |
| `devtools.logStore.sql.path` | Local SQLite database path for development or explicit single-instance demos. | none |

Only safe public fields are exposed through `runtimeConfig.public.odata`.
Proxied services expose their name, strategy, and optional route but not their
backend URL. Direct services also expose their URL because the browser must call
that endpoint. Secrets must stay in private runtime config, environment
variables, or BTP services.

### Service Config

Each service is an `ODataServiceConfig`.

| Field | Purpose |
| --- | --- |
| `name` | Stable service identifier used by `useOData()` and Explorer APIs. |
| `url` | Absolute backend URL or local EDMX path, depending on context. |
| `route` | Optional URL segment under `basePath`; defaults by service name where needed. |
| `icon` | Optional Iconify class used by Explorer. |
| `strategy` | `proxied` routes through Nitro; `direct` can use browser access. |
| `proxyMode` | `stream` for efficient forwarding or `buffer` for inspectable payloads. |
| `destination` | SAP BTP destination name. |
| `auth` | Service-specific Basic, Bearer, or mock auth data. |
| `headers` | Service-specific outbound headers. |
| `rules` | Declarative proxy policy rules. |
| `csrf` | Private server policy. Set `{ mode: 'sap' }` to enable request-scoped SAP token/session preparation; generic OData defaults to `none`. |

## Environment Overrides

The Nuxt module reads runtime overrides from environment variables.

Global examples:

```bash
NUXT_ODATA_AUTH_USERNAME=...
NUXT_ODATA_AUTH_PASSWORD=...
NUXT_ODATA_AUTH_BEARER_TOKEN=...
NUXT_ODATA_HEADERS='{"x-client":"odx"}'
NUXT_ODATA_REJECT_UNAUTHORIZED=false
```

Service examples:

```bash
NUXT_ODATA_SERVICES_NORTHWIND_URL=https://example.com/odata
NUXT_ODATA_SERVICES_NORTHWIND_DESTINATION=NorthwindDestination
NUXT_ODATA_SERVICES_NORTHWIND_AUTH_USERNAME=...
NUXT_ODATA_SERVICES_NORTHWIND_AUTH_PASSWORD=...
NUXT_ODATA_SERVICES_NORTHWIND_HEADERS='{"x-client":"odx"}'
NUXT_ODATA_SERVICES_NORTHWIND_HEADERS_X_API_KEY=...
NUXT_ODATA_SERVICES_NORTHWIND_CSRF_MODE=sap
NUXT_ODATA_SERVICES_NORTHWIND_CSRF_FETCH_METHOD=HEAD
```

The service key is the uppercase service name.

`NUXT_ODATA_REJECT_UNAUTHORIZED=false` is an explicit runtime escape hatch for
development systems that use certificates unavailable to the local trust store.

## `useOData`

`useOData` is auto-imported by the Nuxt module.

Typed dot notation:

```ts
const { data, pending, error } = await useOData()
  .Northwind
  .Products
  .list({
    $select: ['ProductID', 'ProductName'],
    $filter: 'UnitPrice gt 20',
  })
```

Dynamic functional notation:

```ts
const service = useOData('Northwind')
const { data } = await service.entitySet('Products').list()
```

For imperative controller effects, use `fetchList()` or `fetchOne()` instead
of creating Nuxt `AsyncData` outside setup:

```ts
const product = await service.entitySet('Products').fetchOne(
  { ID: 1, Locale: 'en' },
  { $select: ['ID', 'Name'] },
  { signal },
)
```

Entity-set methods:

| Method | HTTP | Return |
| --- | --- | --- |
| `list(query?, options?)` | `GET` | Nuxt `AsyncData<T[]>` compatible promise |
| `listPage(query?, options?)` | `GET` | Nuxt `AsyncData<ODataCollectionPage<T>>` compatible promise |
| `listNextPage(continuation, options?)` | `GET` | Nuxt `AsyncData<ODataCollectionPage<T>>` compatible promise |
| `fetchList(query?, options?)` | `GET` | `Promise<T[]>` |
| `fetchPage(query?, options?)` | `GET` | `Promise<ODataCollectionPage<T>>` |
| `fetchNextPage(continuation, options?)` | `GET` | `Promise<ODataCollectionPage<T>>` |
| `listNavigation<TResult>(source, path, query?, options?)` | `GET` | Nuxt `AsyncData<TResult[]>` compatible promise |
| `listNavigationPage<TResult>(source, path, query?, options?)` | `GET` | Nuxt `AsyncData<ODataCollectionPage<TResult>>` compatible promise |
| `listNavigationNextPage<TResult>(source, path, continuation, options?)` | `GET` | Nuxt `AsyncData<ODataCollectionPage<TResult>>` compatible promise |
| `fetchNavigationList(source, navigationPath, query?, options?)` | `GET` | `Promise<T[]>` |
| `fetchNavigationPage<TResult>(source, path, query?, options?)` | `GET` | `Promise<ODataCollectionPage<TResult>>` |
| `fetchNavigationNextPage<TResult>(source, path, continuation, options?)` | `GET` | `Promise<ODataCollectionPage<TResult>>` |
| `createNavigationRootReference(source, path)` | none | Validated service-relative `$root/...` collection reference |
| `fetchOne(key, query?, options?)` | `GET` | `Promise<T>` |
| `fetchOneWithResponse(key, query?, options?)` | `GET` | `Promise<{ data: T; etag?: string }>` |
| `fetchMedia(key, options?)` | `GET .../$value` | `Promise<ODataMediaResponse>` |
| `createMedia(body, options)` | `POST` | `Promise<ODataMediaCreateResponse<T>>` |
| `createNavigationMedia<TResult>(source, navigationPath, body, options)` | `POST` | `Promise<ODataMediaCreateResponse<TResult>>` |
| `get(key, query?, options?)` | `GET` | Nuxt `AsyncData<T>` compatible promise |
| `create(body, options?)` | `POST` | `Promise<T>` |
| `createWithResponse(body, options?)` | `POST` | `Promise<ODataCreateResponse<T>>` |
| `createNavigation(source, navigationPath, body, options?)` | `POST` | `Promise<TResult>` |
| `updateNavigation(source, navigationPath, update, options?)` | `PATCH` | `Promise<TResult>` |
| `removeNavigation(source, navigationPath, targetKey, options?)` | `DELETE` | `Promise<unknown>` |
| `linkNavigation(source, navigationPath, targetEntitySet, targetKey, options?)` | `POST .../$ref` | `Promise<unknown>` |
| `unlinkNavigation(source, navigationPath, targetKey, options?)` | `DELETE .../$ref` | `Promise<unknown>` |
| `update(key, body, options?)` | `PATCH` | `Promise<T>` |
| `updateWithResponse(key, body, options?)` | `PATCH` | `Promise<{ data?: T; etag?: string }>` |
| `merge(key, body, options?)` | `MERGE` | `Promise<T>` |
| `mergeWithResponse(key, body, options?)` | `MERGE` | `Promise<{ data?: T; etag?: string }>` |
| `updateMedia(key, body, options)` | `PUT .../$value` | `Promise<{ etag?: string }>` |
| `remove(key, options?)` | `DELETE` | `Promise<unknown>` |
| `invoke(action, invocation?, options?)` | `POST` | `Promise<TResult>` |
| `invokeFunction(functionName, invocation?, options?)` | `GET` | `Promise<TResult>` |

Use `list` during Nuxt setup when SSR-aware `AsyncData` is desired. Use
`fetchList` for imperative controller effects; it forwards cancellation and
other request options to the configured ODX transport. `fetchNavigationList`
performs the same imperative read relative to a keyed parent entity. Its
navigation path can be a slash-delimited string or an array of validated
identifier segments. The `source` is normally an `ODataKey`; for a contained
row it can instead be an `ODataContainedEntitySource` with a root key and
ordered keyed containment segments. This represents paths such as
`Products(1)/Items(2)/Tags` without accepting executable path strings.

Mutation options are forwarded to the same transport, including `signal` and
headers such as `If-Match`. `createNavigation` posts to a collection-valued
navigation of a typed parent key. `updateNavigation` patches a related entity;
its `update` argument contains the `body` and an optional `targetKey`. Omit the
target key for a single-valued navigation and provide it for an entity in a
collection-valued navigation. `removeNavigation` deletes one contained collection
member using its exact parent path and related-entity key; it does not unlink a
non-contained relationship through `$ref`. `linkNavigation` adds an existing
target through a validated service-relative `@odata.id`; `unlinkNavigation`
removes that relationship without deleting the target. Runtime entity sets
advertise the latter contract with `supportsNavigationReferences === true`.
All navigation mutations
require a non-empty path of identifier segments, keeping keys, navigation
structure, and payload separate until the ODX client boundary. `invoke` requires a qualified action name. Omit
the invocation key for unbound or collection-bound actions and provide it for an entity-bound
action; `parameters` become the POST body. Enumeration values use their declared
member-name string in that JSON body and are never rewritten to their underlying
integer by ODX. Metadata-aware callers validate membership before invoking the
transport. `invokeFunction` uses the same binding
shape for qualified OData V4 functions, but sends `GET` and serializes each
parameter from an explicit `{ type, value }` descriptor into the inline function
call. Supported values are primitive EDM types; unsupported or malformed values
are rejected before transport.

Use `listPage` or `fetchPage` when the consumer needs an OData V4
`@odata.count` or V2 `__count`. Their explicit
`{ items, totalCount, continuation }` result
survives Nuxt SSR serialization; custom properties attached to arrays do not.
Request the matching protocol count option with `$count: true` for V4 or
`$inlinecount: 'allpages'` for V2. Runtime entity sets expose
`supportsCollectionPages === true`; the additive methods live on
`ODataPagedEntitySet` and `ODataPagedService` so existing structural
`ODataEntitySet` and `ODataService` implementations remain valid.

If the backend includes a V2 `__next` or V4 `@odata.nextLink`, the optional
`continuation` contains only its validated, exactly preserved query component.
Pass that opaque value unchanged to `listNextPage` or `fetchNextPage` on the
same entity set. ODX never follows the origin or resource path supplied by the
backend; it anchors the token to the configured entity-set path. The methods
and `supportsContinuations === true` marker live on the separate additive
`ODataContinuationEntitySet` capability. This is a typed-client guarantee,
not wire-response redaction: consumers of the raw proxy body can still observe
the backend's original absolute next-link URL.
Related collections use the corresponding `listNavigationPage`,
`fetchNavigationPage`, `listNavigationNextPage`, and
`fetchNavigationNextPage` methods. Their continuation is anchored to the same
validated parent source and navigation path, which keeps object-page line-item
paging from trusting a path supplied by the backend.

Use `fetchOneWithResponse` when a later update or delete must carry the
entity's optimistic-concurrency validator. It intentionally exposes only the
flattened `data` and optional `etag`, not general transport headers. HTTP
`ETag` is authoritative; OData V4 `@odata.etag` and V2
`d.__metadata.etag` are fallbacks. Pass the returned value explicitly as an
`If-Match` mutation header. ODX does not cache validators, retry failed
mutations, or silently change the body-only behavior of `get` and `fetchOne`.
The method lives on the additive `ODataVersionedEntitySet` and
`ODataVersionedService` read contracts; runtime entity sets advertise it with
`supportsEntityResponses === true`, leaving existing structural page clients
source-compatible.

Use `updateWithResponse` for the corresponding conditional PATCH when the
consumer must retain the validator returned for the updated representation.
Pass the previously read ETag through `options.headers['If-Match']`; a stale
validator remains an ordinary backend `412 Precondition Failed`, while a
successful response yields its next ETag and, when the service returns one,
the flattened entity representation. A valid `204 No Content` response has no
`data` property. The method lives on the separate additive
`ODataConcurrencyEntitySet` / `ODataConcurrencyService` capability, advertised
by `supportsOptimisticConcurrency === true`, so existing structural versioned
read clients remain source-compatible. The existing `update` method remains
body-only.

Use `createWithResponse` when the create request may use
`Prefer: return=minimal`, or when the consumer needs the created entity's ETag
or advertised identity. Its additive `ODataCreateResponse<T>` contains an
optional flattened `data` representation plus optional `etag`, `entityId`
(`OData-EntityId`), and `location` fields. A valid bodyless response therefore
does not fabricate entity data. Runtime clients advertise this capability with
`supportsCreateResponses === true`; the original body-only `create` contract
is unchanged. The ODX proxy forwards relative created-entity locations but
removes absolute and protocol-relative backend locations in buffered and
streaming modes so private destination hosts cannot leak to browser clients.

SAP Gateway OData V2 services that require `MERGE` can use the explicit
`merge` and `mergeWithResponse` counterparts. ODX does not silently replace
PATCH with MERGE or infer an update verb from service metadata; both protocol
operations remain visible and independently testable. These methods belong to
the separate additive `ODataMergeEntitySet` / `ODataMergeService` capability,
advertised by `supportsMerge === true`; existing concurrency contracts are not
widened.

`fetchMedia` and `updateMedia` expose the additive `ODataMediaEntitySet`
contract, advertised by `supportsMediaStreams === true`. Omitting
`options.streamProperty` addresses a media entity's default stream; supplying
a validated identifier addresses a named `Edm.Stream` property. Reads return
an `ArrayBuffer` plus optional `contentType`, `contentDisposition`, and `etag`
metadata. Replacements accept only `ArrayBuffer` or `Uint8Array`, use `PUT`,
require an explicit valid `contentType`, and preserve caller headers such as
`If-Match` while keeping that content type authoritative. These methods are
imperative and intentionally do not place binary data into Nuxt SSR payloads.
They do not infer stream properties from CSDL or define attachment UI.

`createMedia` posts an initial default stream to the entity collection.
`createNavigationMedia(source, navigationPath, body, options)` posts the same
validated binary contract to an explicit collection-valued navigation below a
root or contained parent, requests the created representation, and retains its
response ETag. Both create methods keep validated `Content-Type`,
`Prefer: return=representation`, and optional `Slug` authoritative over caller
headers. ODX validates address segments but leaves navigation cardinality and
media-entity semantics to the metadata-aware caller.

Service-level methods:

| Method | HTTP | Return |
| --- | --- | --- |
| `changeSet(mutations, options?)` | `POST .../$batch` | `Promise<readonly ODataChangeSetResponse[]>` |
| `batchChangeSets(changeSets, options?)` | `POST .../$batch` | `Promise<readonly ODataBatchChangeSetResult[]>` |
| `invokeFunction(functionName, invocation?, options?)` | `GET` | `Promise<TResult>` |

`changeSet` accepts typed service-, collection-, and entity-bound `action`
members, root `update`, binary `update-media`, `create-navigation`,
`update-navigation`, and
`delete-navigation`, `link-navigation`, and `unlink-navigation` mutations and
serializes them into one atomic OData V4
changeset. Each mutation keeps its own key, payload where
applicable, and optional headers such as `If-Match`; request options such as
`signal` and correlation headers apply to the outer batch request. The method
rejects if any changeset member fails, so callers must not infer success from
the outer batch status alone. Entity-set and navigation names are validated as
identifier segments before transport.

`update-media` accepts only `ArrayBuffer` or `Uint8Array`, requires an exact
valid `contentType`, and derives the default or named `$value` target from an
entity set, typed key, and optional stream-property identifier. ODX preserves
the bytes in the multipart body and rejects missing media types or MIME-boundary
collisions. Pairing this member with a normal root `update` lets services commit
stream bytes and linked file-name or media-type fields atomically. Generated
Nuxt services advertise the additive contract with
`supportsAtomicMediaChangesets === true`.

`batchChangeSets` accepts an ordered array of mutation groups and sends every
group as a separate changeset in one outer request. Transport and malformed
multipart failures reject the call; valid non-2xx changeset results are returned
with `succeeded: false` beside successful groups. A response-count mismatch
fails closed before callers can associate an outcome with the wrong input.

Generated Nuxt services expose `supportsAtomicActionChangesets === true`.
Consumers that conditionally use action members can check this capability and
remain compatible with older runtimes whose changesets only support mutations.
They also expose `supportsAtomicMediaChangesets === true` for binary stream
members and `supportsBatchChangeSets === true` for the independent grouped
contract.

Keys may be strings, numbers, booleans, or composite key objects.

`ODataQuery` uses `$count` for OData V4 count intent and `$inlinecount` for
OData V2.

## Proxy Package

`@me-tools/odx-proxy` exports:

- `createODataHandler(config)` for standalone H3 usage.
- `odataGuard(ctx)` and `ODataGuard` rule utilities.
- OData client/log/CSRF helpers re-exported from core.

Core log helpers include the `OdxLogStore` interface, `OdxMemoryLogStore`,
`setOdxLogStore`, `getOdxLogStore`, `resetOdxLogStore`, `addODataLog`,
`updateODataLog`, `getODataLogs`, `getODataLog`, `clearODataLogs`,
`redactSensitiveHeaders`, `boundLogPayload`, and `sanitizeODataLog`. Store
implementations must redact sensitive headers and bound or omit payloads before
entries are persisted.

The Nitro module is available as `@me-tools/odx-proxy/nitro`.

## Proxy Rules

Declarative service rules currently include:

- `allowOnlyMethods`
- `denyMethods`
- `requireScope`
- `requireAttribute`
- `denyPath`
- `denyIfHeader`
- `injectHeader`
- `rewritePath`
- `validate` for programmatic use through `ODataGuard`

Rules are applied only for non-direct proxy flows.

Programmatic validators may be synchronous or asynchronous. Async validators
must be awaited or returned from the hook so proxying waits for the decision:

```ts
nitro.hooks.hook('odx:proxy:request', async (ctx) => {
  await odataGuard(ctx).validate('tenant-check', async () => {
    return await canAccessTenant(ctx.event)
  })
})
```

Calling an async validator without awaiting or returning the promise starts the
check but does not block the proxy request.

## Nitro Hooks

Proxy hooks are available through Nitro runtime hooks:

```ts
export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook('odx:proxy:request', async (ctx) => {
    ctx.fetchOptions.headers = {
      ...ctx.fetchOptions.headers,
      'x-source': 'odx',
    }
  })
})
```

Supported hook names:

- `odx:proxy:request`
- `odx:proxy:request:<ServiceName>`
- `odx:proxy:response`
- `odx:proxy:response:<ServiceName>`

Response hooks run for buffered proxy responses and are awaited before the
proxied request resolves. Stream proxy response-hook behavior is not part of the
current public contract.

## Internal Explorer Endpoints

These endpoints are internal to ODX Explorer and may change faster than the
public composable and module APIs.

In local development they preserve Nuxt DevTools ergonomics and can expose more
diagnostic state to the local developer. In production every `/__odx__/*`
endpoint requires validated SAP security context before returning runtime data.

Production `/__odx__/config` returns only the top-level Explorer runtime fields
`basePath`, `mode`, and `services`; each service entry is limited to `name`,
`route`, `icon`, `strategy`, `proxyMode`, `entities`, `isGenerated`, `version`,
and `metadata`. The `metadata` object is limited to runtime cache state:
`status`, `source`, `stale`, `staleReason`, `refreshedAt`, `timestamp`, `hash`,
`bytes`, and optional `message`. It does not return backend URLs,
destinations, auth, outbound headers, rules, unknown service fields, global
secrets, runtime paths, hooks, DevTools config, `forwardAuthHeader`, or
`versions.node`.

| Endpoint | Development behavior | Current production policy |
| --- | --- | --- |
| `/__odx__/config` | Resolved service config, entities, versions, and generation status for DevTools inspection. | Authenticated. Returns only top-level `basePath`, `mode`, and sanitized `services` entries with entity and metadata cache state. |
| `/__odx__/logs` | Memory-backed traffic logs through `OdxLogStore` by default. `GET` supports retention-friendly filters such as `limit`, `offset`, `service`, `method`, `status`, `from`, `to`, `before`, `after`, `includePending=false`, and `order=asc\|desc`; `DELETE` clears all local logs or a bounded subset with `service`, `before`, or `to`. Logs redact secrets and bound large payloads before storage, display, export, or test use. | Authenticated. With `devtools.logStore.provider=sql`, returns and clears persisted redacted traffic logs through the `OdxLogStore` boundary. Without SQL storage, returns `[]` and rejects `DELETE`. Production payload bodies are omitted by default. |
| `/__odx__/generate?service=<name>` | Development SDK/type regeneration for one service when the Nuxt generator is present. It refreshes metadata first, then runs `odata2ts` through the injected generator. Hosts without a generator return `501`. | Authenticated. Refreshes runtime metadata cache state only. It does not run `odata2ts` or write generated TypeScript SDK files. Responses include `operation: "metadata-refresh"`, stale state, timestamp, hash, byte count, and metadata source. |
| `/__odx__/schema?service=<name>` | Parsed EDMX schema. `raw=true` can return XML locally. | Authenticated. Uses cached parsed metadata only and rejects raw XML. |
| `/__odx__/types?service=<name>` | Local generated TypeScript model files. | Authenticated but disabled. Returns `403`. |
| `/__odx__/me` | Current user info from SAP security context or local fallback. | Authenticated. Returns sanitized SAP user context and omits raw token data. |

There is no `/__odx__/mockdata` endpoint. The Explorer can export JSON for
local mock fixtures, but mock-data file management stays in the development
workspace and is not exposed as a runtime API.

Runtime metadata refresh and TypeScript SDK generation are intentionally
separate contracts. Production refresh updates Explorer metadata cache state
only and may return `stale: true` when it had to use cached EDMX because the
backend was unreachable. Generated SDK/type files remain development, build, or
CI artifacts.

Production traffic history is disabled unless SQL log storage is explicitly
configured. The `OdxLogStore` boundary, memory implementation, db0-backed SQL
adapter, redaction rules, payload limits, and clear semantics exist now.
Persistent adapters must stay behind `OdxLogStore` and must not expose database
APIs to Explorer.

Do not expose secrets from these endpoints. Treat them as development and
authenticated tool surfaces, not public product APIs.
