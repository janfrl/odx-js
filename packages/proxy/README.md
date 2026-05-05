# @bc8-odx/proxy

Framework-agnostic H3 server handlers for OData request proxying, CSRF token management, and development logging.

## Installation

```bash
pnpm add @bc8-odx/proxy
```

## Verification

From the repository root:

```bash
pnpm.cmd --filter @bc8-odx/proxy run verify
pnpm.cmd run bench:proxy
```

`pnpm.cmd --filter @bc8-odx/proxy run verify` runs the proxy Vitest suite and
the same standalone fixture check as `pnpm.cmd run example:proxy`. It starts a
local fixture backend and H3 proxy, then verifies proxied OData reads and
header forwarding through `@bc8-odx/proxy`.

`pnpm.cmd run bench:proxy` runs the proxy performance benchmark. It verifies
buffer and stream proxy responses match the fixture backend, then reports
direct, proxied, concurrent, and DevTools logging timing baselines. Scenarios
with a direct or logging baseline include both absolute average overhead and
relative average overhead percentage. The table also reports the median
per-round average and per-round standard deviation so local noise is visible.
Use
`ODX_PROXY_BENCHMARK_OUTPUT=reports/proxy-benchmark.json` to also write the
same fields and run metadata to a JSON summary; `reports/` is ignored by git.
Use `ODX_PROXY_BENCHMARK_ROUNDS` to adjust the number of measurement rounds.
Use `ODX_PROXY_BENCHMARK_CONCURRENCY` with a positive integer to adjust
concurrent large-response requests.
Use `pnpm.cmd` on Windows PowerShell in this repository when `.ps1` launchers
are blocked.

To compare two generated benchmark reports:

```bash
ODX_PROXY_BENCHMARK_OUTPUT=reports/proxy-benchmark-a.json pnpm.cmd run bench:proxy
ODX_PROXY_BENCHMARK_OUTPUT=reports/proxy-benchmark-b.json pnpm.cmd run bench:proxy
pnpm.cmd run bench:proxy:compare -- reports/proxy-benchmark-a.json reports/proxy-benchmark-b.json
```

**For full documentation, server-side configuration, and security guides, please visit: [odx-js.io/packages/proxy](https://odx-js.io/packages/proxy)**
