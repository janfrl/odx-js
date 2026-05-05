# Deployment

ODX supports local Nuxt development and a SAP BTP Cloud Foundry full-stack
deployment.

## Local Development

Install dependencies:

```bash
pnpm install
```

Prepare generated Nuxt/module state:

```bash
pnpm run dev:prepare
```

Start the playground:

```bash
pnpm run dev
```

Start the Docus documentation site:

```bash
pnpm run docs
```

Regenerate API reference metadata:

```bash
pnpm run docs:api
```

The Nuxt module starts the Explorer DevTools UI from `packages/explorer` during
local development. The Explorer dev server uses port `3300` and is mounted in
the host app at `/__odx__/client/`.

## Build

The root build script builds the Explorer, builds the proxy, adjusts generated
Nitro package metadata for deployment, and creates an MTA archive:

```bash
pnpm run build
```

The resulting archive is written to:

```txt
mta_archives/odx-fullstack.mtar
```

## Deploy

Deploy the generated MTA archive to Cloud Foundry:

```bash
pnpm run deploy
```

The script runs:

```bash
cf deploy mta_archives/odx-fullstack.mtar
```

## MTA Modules

`mta.yaml` defines three deployable modules.

### `odx-approuter`

Path: `packages/approuter`

Purpose:

- Authenticated edge entry point.
- Routes `/api/odx/*` to the proxy.
- Routes `/explorer/*` to the Explorer UI.
- Forwards auth tokens to backend destinations.

### `odx-proxy`

Path: `packages/proxy/.output`

Purpose:

- Runs the Nitro-built proxy server with `node server/index.mjs`.
- Resolves OData backends from BTP destinations, absolute URLs, or local
  fallbacks.
- Handles XSUAA validation, destination lookup, rules, hooks, headers, and
  telemetry.

### `odx-explorer`

Path: `packages/explorer/.output`

Purpose:

- Runs the Nitro-built Explorer UI with `node server/index.mjs`.
- Provides the authenticated browser workbench for services, schemas, traffic,
  entities, and proxy traces.

## BTP Resources

`mta.yaml` binds:

- `odx-xsuaa`: XSUAA application service using `xs-security.json`.
- `odx-destination`: Destination service for managed backend destinations.
- `odx-connectivity`: Connectivity service for on-premise destinations.

`xs-security.json` currently configures:

- dedicated tenant mode
- `employee_id` and `company_id` user attributes
- an `odx_user` role template
- token exchange support
- redirect URI patterns for BTP, Cloud Foundry, and SAP Business Application
  Studio style hosts

## AppRouter Routes

`packages/approuter/xs-app.json` declares:

| Source | Destination | Auth |
| --- | --- | --- |
| `^/api/odx/(.*)$` | `odx-proxy-backend` | XSUAA |
| `^/explorer/(.*)$` | `odx-explorer-ui` | XSUAA |

The welcome file is `/explorer/`.

## Service Configuration In Deployment

Configuration can come from:

- checked-in Nuxt `odata` options
- environment variables
- BTP user-provided service credentials read from `VCAP_SERVICES`
- BTP Destination service entries

Use environment variables or BTP services for deployment-specific secrets and
backend URLs. Do not commit credentials, tenant-specific destinations, or local
`default-env.json`.

## Metadata And Type Cache

Remote EDMX metadata is cached in two places:

- `.nuxt/odx/temp/<service>.edmx` for runtime/generated Nuxt state
- `.odx/cache/<service>.edmx` as a persistent cache across `.nuxt` cleanup

The persistent cache is a local/generated artifact. Do not commit it unless a
future release intentionally changes that policy.

## Operational Checks

Before deployment-sensitive changes, run the relevant checks:

```bash
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm --filter odx-approuter run verify
pnpm run build
```

For documentation-only changes, `git diff --check` is usually enough.

After deployment, useful Cloud Foundry checks are:

```bash
cf apps
cf env odx-proxy
cf env odx-approuter
cf logs odx-proxy --recent
cf logs odx-approuter --recent
```

## Common Failure Points

- Destination name in service config does not match BTP Cockpit.
- XSUAA or Destination service is not bound to the expected module.
- Authorization header is not forwarded by the approuter destination.
- On-premise destination requires Connectivity service binding.
- Metadata generation cannot reach `$metadata` and no `.odx/cache` fallback
  exists.
- `rejectUnauthorized` behavior differs between local development and deployed
  environments.
