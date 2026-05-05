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
direct, proxied, concurrent, and DevTools logging timing baselines. Use
`ODX_PROXY_BENCHMARK_OUTPUT=reports/proxy-benchmark.json` to also write a JSON
summary; `reports/` is ignored by git. Use `pnpm.cmd` on Windows PowerShell in
this repository when `.ps1` launchers are blocked.

**For full documentation, server-side configuration, and security guides, please visit: [odx-js.io/packages/proxy](https://odx-js.io/packages/proxy)**
