# @me-tools/odx-proxy

Framework-agnostic H3 server handlers for OData request proxying, CSRF token management, and development logging.

## Installation

```bash
pnpm add @me-tools/odx-proxy
```

Explorer schema responses are projected from the loss-aware
`@me-tools/odx-metadata` CSDL document. Raw XML is parsed once; entity,
association, navigation, version, and namespace summaries share that parsed
source instead of maintaining endpoint-specific XML regular expressions.
Concurrent production refreshes for the same runtime metadata cache share one
upstream request, preventing duplicate work and nondeterministic cache-state
writes. A later explicit refresh always starts a fresh request.

Runtime metadata downloads preserve UTF-8 characters across network chunks.
Response-stream errors, aborted responses and premature closes fail the refresh
instead of leaving it pending or storing a partial body. An existing cache may
be returned with `stale: true` and a sanitized failure reason; without a cache,
the refresh fails. A later explicit refresh can recover from the upstream
failure. This runtime refresh does not regenerate deployed TypeScript SDKs.

Runtime metadata refresh appends `/$metadata` to the resolved URL path before
its query parameters. A configured or Destination-provided service URL such as
`/odata?sap-client=100` therefore requests `/odata/$metadata?sap-client=100`.
Encoded query values are preserved and URL fragments are not sent upstream.
This URL handling does not change destination authentication or header policy.

Proxied data calls apply the same base-URL ownership: they append the OData
resource path before a configured query and then append the incoming request
query without reparsing either component. Absolute configured and
Destination-provided bases accept case-insensitive HTTP(S) schemes, reject URL
userinfo and browser-normalized backslashes, and remove fragments. This keeps
Basic or Bearer authentication in the explicit auth contract rather than
embedding credentials in a request or diagnostic URL.

Remote cache updates require XML that the shared CSDL parser can read and an
`Edmx` root in the OData V2 or V4 EDMX namespace; prefixes are not significant.
Malformed XML, HTML error pages and foreign envelopes cannot replace a good
cache even when the upstream returns HTTP 200. Cache fallback checks the
temporary copy first, then the persistent copy, using the same parser and
envelope checks. A damaged temporary copy can be restored from a valid
persistent copy. If neither is valid, refresh fails without reporting corrupt
metadata as a successful stale snapshot. This validates XML and its envelope,
not all vocabulary references or the upstream service's current availability.

The exported Nitro module keeps its request plugins and their generated shared
chunks inside the host bundle. This preserves Nitro's virtual runtime imports
for both installed packages and workspace builds instead of loading the plugin
files as standalone Node modules.

The proxy mount is an app-local route boundary. `normalizeODataProxyBasePath`
removes trailing slashes from valid paths such as `/api/odx/` and rejects root,
absolute, protocol-relative, traversal, empty-segment, query, fragment,
backslash, and whitespace forms before handler registration. Request parsing
also requires the incoming path to remain on that exact segment boundary.

## Backend header isolation

Normal proxied calls merge global headers, service headers and permitted
incoming headers in that order, ignoring header-name case. Configured Basic or
Bearer auth selects the service profile, or global auth when that profile is
absent, and overrides incoming Authorization. An explicit `{ auth: {} }` or
partial profile does not borrow global fields. Destination auth is resolved
independently; absent Destination credentials do not select global auth.

The `direct` bridge inherits neither global headers nor computed backend auth.
Explicit service headers and permitted incoming headers remain available.
The development Destination fallback does not acquire global auth credentials.

Buffered and streamed requests use the same filtered backend headers. Streaming
replaces H3's incoming-header merge at the final transport dispatch so removed
browser cookies, forwarding metadata and hop-by-hop credentials cannot reappear.
`forwardAuthHeader: false` excludes incoming Authorization; configured or resolved
backend auth can still set its own Authorization. Explicit backend cookies, managed auth,
CSRF session headers and Connectivity dispatch remain supported; backend
Set-Cookie is not returned to the browser.

## SAP BTP On-Premise destinations

Destinations with `ProxyType=OnPremise` are sent through the bound SAP BTP
Connectivity HTTP proxy. ODX obtains a Connectivity service token, configures
an authenticated proxy dispatcher, and uses that same route for runtime
metadata refreshes, CSRF preflights, and buffered or streamed OData requests. A destination cannot
fall through to a direct request when the Connectivity binding is missing or
its proxy host/port is invalid.

ODX reads `onpremise_proxy_host` and `onpremise_proxy_http_port` from the
binding. The deprecated `onpremise_proxy_port` remains a compatibility
fallback, but no region-specific host or port is synthesized. For a
`PrincipalPropagation` destination with an inbound user token, ODX adds
`SAP-Connectivity-Authentication` inside the tunnel; all other destination
authentication continues to use the credentials returned by Destination
service.

## SAP CSRF mutations

SAP services can opt into request-scoped CSRF preparation with
`csrf: { mode: 'sap' }`. ODX fetches a token plus its session cookies, then
applies them to the matching
buffered or streamed backend request. Missing tokens fail closed. `If-Match`
is preserved and responses forward allowlisted OData metadata headers such as
`etag` and `sap-message`. Absolute backend `location` values are not
forwarded because they may disclose private destination hosts. The same rule
applies to `OData-EntityId`; relative created-entity identities remain visible
for `Prefer: return=minimal` clients.

The generic OData default is `csrf: { mode: 'none' }`. Use
`csrf: { mode: 'sap', fetchMethod: 'GET' }` when the SAP service does not
support `HEAD` token requests. Tokens are not cached or automatically retried
in the current contract.

## Operational telemetry

Operational telemetry is opt-in:

```ts
export default defineNuxtConfig({
  odata: { telemetry: { enabled: true } },
})
```

When enabled, the proxy publishes one privacy-safe summary after each completed
buffered or streamed request through the `odx:proxy:telemetry` hook. This contract is
observability-vendor neutral: `@me-tools/odx-proxy` does not depend on evlog,
OpenTelemetry, or a drain provider.

```ts
nitroApp.hooks.hook('odx:proxy:request', ({ event }) => {
  event.context.odxOperationId = 'list-report.load:products'
  operationLogger.start(event)
})

nitroApp.hooks.hook('odx:proxy:telemetry', ({ event, summary }) => {
  operationLogger.complete(event, { odx: summary })
})
```

The summary contains only allowlisted operational facts:

- generated request ID and an optional sanitized operation ID;
- service and entity-set identifiers;
- HTTP method, proxy mode, and target kind;
- status, outcome, and duration.

It deliberately excludes URLs, query and filter values, entity keys, request
and response bodies, headers, backend errors, and proxy trace details. The
request ID is also used by the development `OdxLogStore` entry, allowing a
host observability event to link to Explorer diagnostics without duplicating
payload history.

Telemetry hook failures are isolated from the proxied response. Hook handlers
should leave slow exporting to their observability drain. A streamed response
can complete after a generic HTTP request logger has already sealed its event,
so adapters should start a dedicated operation logger from the request hook and
finalize it from the telemetry hook. The optional `odxOperationId` accepts only
1-128 ASCII word, dot, colon, or hyphen characters; invalid identifiers are
omitted.

See
[`research/evlog-observability-evaluation.md`](../../research/evlog-observability-evaluation.md)
for the evlog fit assessment, security boundaries, and pilot gates.

## Verification

From the repository root:

```bash
pnpm --filter @me-tools/odx-proxy run verify
pnpm run bench:proxy
```

`pnpm --filter @me-tools/odx-proxy run verify` runs the proxy Vitest suite and
the same standalone fixture check as `pnpm run example:proxy`. It starts a
local fixture backend and H3 proxy, then verifies proxied OData reads and
header forwarding through `@me-tools/odx-proxy`.

`pnpm run bench:proxy` runs the proxy performance benchmark. It verifies
buffer and stream proxy responses match the fixture backend, then reports
direct, proxied, concurrent, and DevTools logging timing baselines. Scenarios
with a direct, telemetry-disabled, or logging baseline include absolute and
relative average overhead. Operational telemetry has a dedicated 1 ms
enabled-versus-disabled average-overhead gate. The table also reports the median
per-round average and per-round standard deviation so local noise is visible.
Use
`ODX_PROXY_BENCHMARK_OUTPUT=reports/proxy-benchmark.json` to also write the
same fields and run metadata to a JSON summary; `reports/` is ignored by git.
Use `ODX_PROXY_BENCHMARK_ITERATIONS` and `ODX_PROXY_BENCHMARK_ROUNDS` with
positive integers to adjust the number of measured requests and measurement
rounds.
Use `ODX_PROXY_BENCHMARK_CONCURRENCY` with a positive integer to adjust
concurrent large-response requests.

To compare two generated benchmark reports:

```bash
ODX_PROXY_BENCHMARK_OUTPUT=reports/proxy-benchmark-a.json pnpm run bench:proxy
ODX_PROXY_BENCHMARK_OUTPUT=reports/proxy-benchmark-b.json pnpm run bench:proxy
pnpm run bench:proxy:compare -- reports/proxy-benchmark-a.json reports/proxy-benchmark-b.json
```

For full documentation, server-side configuration, and security guides, see the
root documentation in this repository.
