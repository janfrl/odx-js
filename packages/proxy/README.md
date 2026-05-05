# @bc8-odx/proxy

Framework-agnostic H3 server handlers for OData request proxying, CSRF token management, and development logging.

## Installation

```bash
pnpm add @bc8-odx/proxy
```

## Verification

From the repository root:

```bash
pnpm.cmd run example:proxy
pnpm.cmd run bench:proxy
```

`pnpm.cmd run example:proxy` runs `examples/proxy-standalone.ts`. It starts a
local fixture backend and H3 proxy, then verifies proxied OData reads and
header forwarding through `@bc8-odx/proxy`.

`pnpm.cmd run bench:proxy` runs the proxy performance benchmark. It verifies
buffer and stream proxy responses match the fixture backend, then reports
direct, proxied, concurrent, and DevTools logging timing baselines. Use
`pnpm.cmd` on Windows PowerShell in this repository when `.ps1` launchers are
blocked.

**For full documentation, server-side configuration, and security guides, please visit: [odx-js.io/packages/proxy](https://odx-js.io/packages/proxy)**
