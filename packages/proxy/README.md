# @me-tools/odx-proxy

Framework-agnostic H3 server handlers for OData request proxying, CSRF token management, and development logging.

## Installation

```bash
pnpm add @me-tools/odx-proxy
```

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
