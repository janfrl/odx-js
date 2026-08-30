# @me-tools/odx-core

Framework-agnostic OData types and low-level utilities for handling results,
metadata, query stringification, and safe resource-path construction.

The package also exports `prepareSapCsrfHeaders` and `fetchWithCsrf` for
server/edge transports. These helpers are not browser transports: browsers
cannot read SAP `Set-Cookie` responses or emit the matching `Cookie` header.
Browser applications should send mutations through `@me-tools/odx-proxy`.

Portable path helpers include `formatODataKey`, `createODataEntityPath`,
`createODataEntityReference`, `createODataMediaPath`,
`createODataNavigationRootReference`, `formatODataNavigationPath`,
`formatODataFunctionCall`, `formatODataV2FunctionImportParameters`,
`joinODataPath`, and identifier validators. They
construct service-relative protocol paths without depending on Nuxt, Node.js,
or a transport client. Entity references intentionally retain a validated
service-relative `@odata.id`; consumers never supply an origin or executable
path string. Navigation root references reuse the same validated entity-key,
containment, and navigation serializers for expressions such as recursive
hierarchy transformations.

### Exact typed entity keys

An ordinary string key remains an OData string literal. Do not convert Decimal
or Int64 identity to a JavaScript number, or pass an unquoted path fragment.
Use `createODataTypedKey` with the metadata-owned EDM type and explicit protocol:

```ts
import { createODataEntityPath, createODataTypedKey } from '@me-tools/odx-core'

const key = createODataTypedKey([
  { field: 'ID', type: 'Edm.Decimal', value: '9007199254740993.1234567890' },
], 'v4')
createODataEntityPath('Balances', key)
// Balances(9007199254740993.1234567890)
```

The frozen, JSON-serializable key is accepted wherever `ODataKey` is accepted,
including reads, conditional writes, composite keys, and containment sources.
The complete Nuxt runtime and server transports advertise
`supportsTypedEntityKeys: true` for capability-negotiating consumers.
Select `v2` explicitly for V2 literal suffixes; this does not change the HTTP
method, service configuration, or batch protocol. Existing primitive and named
record keys are unchanged. Metadata ownership and completeness remain the
caller's responsibility; ODX validates names, duplicates, supported literal
types, and numeric values, not membership in a particular entity type.

The literal boundary follows the [OData 4.01 URL conventions](https://docs.oasis-open.org/odata/odata/v4.01/os/part2-url-conventions/odata-v4.01-os-part2-url-conventions.html)
and the [OData V2 URI conventions](https://www.odata.org/documentation/odata-version-2-0/uri-conventions/).

`formatODataV2FunctionImportParameters` keeps the older service-operation
contract distinct from V4 functions and actions: primitive parameters become
validated V2 query literals, nullable values are omitted, and POST parameters
remain in the URI rather than being moved into a JSON body.
The separate `ODataV2FunctionImportService` capability keeps the base
`ODataService` structurally compatible with transports that do not implement
V2 service operations.

The additive media contracts model default media-entity streams and named
`Edm.Stream` properties without introducing browser or renderer concepts.
Reads return an `ArrayBuffer` plus optional `Content-Type`,
`Content-Disposition`, and `ETag`; replacements accept binary data and an
explicit media type. Media-entity creation posts the initial default stream to
the collection with an exact media type and optional validated `Slug`, requests
a representation, and retains its response ETag. `createODataMediaPath` keeps
entity keys and named stream properties validated before adding the terminal
`$value` segment. Atomic
changesets additionally accept byte-preserving `update-media` members so a
service can commit stream content and linked scalar metadata together.
`$odataCreateMedia`, `$odataFetchMedia`, and `$odataUpdateMedia` provide the
same binary validation, allowlisted response metadata, and exact content-type
rules to any raw-capable transport client, including framework adapters and
server hosts. Media creation preserves an optional representation, ETag,
entity ID, location, and SAP message even when the service returns no body.

For optimistic concurrency, `$odataWithResponse` is the additive low-level
entity read. It returns `{ data, etag? }`, preferring the HTTP `ETag` header
and falling back to OData V4 or V2 body annotations. `$odata` remains the
body-only helper, and arbitrary response headers are not exposed.
`$odataMutationWithResponse` is the mutation counterpart. Its `data` property
is optional because a valid PATCH may return `204 No Content` while still
providing the next ETag. Both low-level request helpers support explicit
`MERGE` for SAP Gateway OData V2 updates; PATCH remains distinct.
Because Fetch-compatible clients do not consistently recognize MERGE as a JSON
mutation method, ODX serializes record bodies explicitly and supplies
`Content-Type: application/json` at this boundary.
The additive `ODataNavigationMergeEntitySet` contract exposes the same explicit
verb for a structured to-one navigation target or keyed related collection
member without widening root-only MERGE clients.
The separate `ODataV2NavigationReferenceEntitySet` contract exposes direct
SAP Gateway `$links` writes with a service-relative `uri` body. It remains
additive so generic OData V4 `$ref` clients are not silently reinterpreted.
V2 `__metadata.etag` values are retained as `@odata.etag` on root and expanded
entities so optimistic-concurrency callers can safely update related records;
other V2 metadata remains stripped.
`$odataPage` is the collection counterpart: it preserves counts and projects
server-driven next links into a safe query-only continuation without exposing
the backend origin or resource path.
The additive `ODataVersionedNavigationEntitySet` contract applies the same
response-aware read semantics to a single-valued navigation or one keyed member
of a related collection. Structured parent sources keep nested containment and
keys separate from executable path strings.

`serializeODataBatchReads` creates read-only `$batch` envelopes from validated
service-relative GET operations. Reads remain top-level `application/http`
parts rather than changesets, and `parseODataBatchReadsResponse` returns their
ordered status, headers, and JSON or text bodies without collapsing a failed
read into a transport-wide failure. Absolute URLs, header injection, empty
batches, and nested write changesets fail closed.

All read and changeset response parsers preserve boundary-like text inside JSON
values and require complete line-delimited MIME envelopes, including nested
changesets. Preamble and epilogue are ignored. A missing closing delimiter
throws `ODataChangeSetError` with `core.changeset.incomplete-response`. For a
write, this does not prove rollback or make an automatic retry safe; the host
must reconcile the unknown outcome.
Empty or unsupported result parts likewise reject with
`core.changeset.invalid-response-part`; they are never skipped to produce a
shorter apparent success. Valid HTTP failures retain their ordinary per-read
or per-changeset outcome contract.

Changeset serializers expose immutable request `contentIds`. Response parsers
retain MIME identity in the optional `ODataChangeSetResponse.contentId`, not
in HTTP `headers`, and preserve wire order. Use
`correlateODataChangeSetResponses(parsed, payload.contentIds)` to pair successful
results with the serialized requests, or `correlateODataBatchChangeSetResponses`
for independent groups. Nuxt's mutation transports do this automatically.
Missing, duplicate, or foreign IDs within an identified successful group fail
closed, as do mismatched successful result counts. Entirely ID-less legacy
groups retain wire order for compatibility; that fallback cannot detect
reordered results and should not be used as evidence of identity correlation.

OData JSON operation advertisements survive response flattening as instance
control information. In particular, an available minimal-metadata
`"#Namespace.Action": {}` remains an empty object and is not collapsed into
the explicit `null` used by OData 4.01 to advertise non-availability. ODX does
not execute an advertised `target`; higher layers retain ownership of validated
operation identity and binding paths.

The `@me-tools/odx-core/server` entry also projects parsed
`@me-tools/odx-metadata` documents into the established entity, navigation,
association, and version contracts. Callers parse XML or JSON CSDL through
`parseCsdl` first; core no longer exposes a second regex- or file-based EDMX
parser.

## Installation

```bash
pnpm add @me-tools/odx-core
```

## Verification

From the repository root:

```bash
pnpm --filter @me-tools/odx-core run verify
```

This runs the focused core Vitest tests and then the same standalone core
fixture check as `pnpm run example:core`. It verifies package utilities and
CSDL projection behavior, plus framework-free usage for OData version
detection, entity extraction, query stringification, OData response flattening,
and the low-level `$odata` helper.

For full documentation, architecture details, and API reference, see the root
documentation in this repository.
