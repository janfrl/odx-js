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

Local Explorer endpoints are optimized for developer feedback. They can expose
resolved config, local generated types, raw metadata XML, and in-memory traffic
logs. Development logs still need secret redaction and payload limits for
outbound headers, auth/session/CSRF data, request bodies, and response bodies.
Traffic logs use the core `OdxLogStore` boundary with the memory store by
default. `devtools.maxLogs` controls local retention count, `devtools.logPayloads`
can omit request/response bodies, and `devtools.maxPayloadBytes` bounds each
stored payload preview.

Local development can opt into SQL-backed Explorer traffic history with:

```bash
NUXT_ODATA_DEVTOOLS_LOG_STORE=sql
NUXT_ODATA_DEVTOOLS_LOG_DB_CONNECTOR=sqlite
NUXT_ODATA_DEVTOOLS_LOG_DB_PATH=.odx/explorer-logs.sqlite
```

SQLite is only appropriate for local development or explicit single-instance
demos. It is not safe for BTP multi-instance production deployments because
each application instance has its own filesystem and locking behavior.

## Build

`build:deployment` builds the Explorer and proxy runtimes, adjusts generated
Nitro package metadata, and creates an MTA archive. The root `build` command is
reserved for the publishable npm packages.

```bash
pnpm run build:deployment
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
- Routes deployed Explorer client assets under `/__odx__/client`.
- Routes only the supported `/__odx__` runtime APIs to the proxy.
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

Persistent production Explorer logs require an additional bound SQL database
for `odx-proxy`. The repository does not mandate a specific BTP SQL provider;
operators should bind the chosen managed SQL service, expose its connection URL
to the proxy as `NUXT_ODATA_DEVTOOLS_LOG_DB_URL`, and set:

```bash
NUXT_ODATA_DEVTOOLS_LOG_STORE=sql
NUXT_ODATA_DEVTOOLS_LOG_DB_CONNECTOR=postgresql
```

The db0 PostgreSQL connector requires the `pg` runtime package for deployments
that select PostgreSQL. Keep database credentials in BTP service bindings or
environment variables, not in checked-in configuration.

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
| `^/__odx__/client$` | `odx-explorer-ui` | XSUAA |
| `^/__odx__/client/(.*)$` | `odx-explorer-ui` | XSUAA |
| `^/__odx__/(config\|logs\|schema\|generate\|types\|me)(/.*\|)$` | `odx-proxy-backend` | XSUAA |
| `^/explorer/(.*)$` | `odx-explorer-ui` | XSUAA |

The welcome file is `/explorer/`.

The deployed Explorer is not the Nuxt DevTools integration. It is a standalone
browser app served behind AppRouter/XSUAA. The `/__odx__/client/*` route serves
that UI. The narrowed `/__odx__/<endpoint>` proxy route supports the standalone
Explorer's same-origin runtime API calls without swallowing client assets.

After AppRouter authentication, the proxy still enforces production Explorer
endpoint policy:

- `/__odx__/config` returns only top-level `basePath`, `mode`, and `services`.
  Service entries are limited to `name`, `route`, `icon`, `strategy`,
  `proxyMode`, `entities`, `isGenerated`, `version`, and `metadata`. The
  `metadata` object is limited to runtime cache state: `status`, `source`,
  `stale`, `staleReason`, `refreshedAt`, `timestamp`, `hash`, `bytes`, and
  optional `message`.
- Backend URLs, destinations, auth, outbound headers, rules, unknown service
  fields, global secrets, runtime paths, hooks, DevTools config,
  `forwardAuthHeader`, and `versions.node` are redacted or omitted.
- `/__odx__/schema` serves parsed cached metadata only and rejects raw metadata
  XML.
- `/__odx__/generate` refreshes runtime metadata cache state only. It uses the
  production-compatible service resolution path to fetch `$metadata`, reports
  stale, timestamp, hash, byte count, and source information, and falls back to
  stale cache when the backend is unreachable.
- `/__odx__/types` returns `403`; production does not expose generated type
  artifacts.
- `/__odx__/logs` returns an empty list and rejects `DELETE` unless persistent
  SQL log storage is explicitly configured. With SQL storage enabled, it lists
  and clears redacted logs behind the existing log store and redaction
  boundary. Production request and response payload bodies are omitted by
  default.
- `/__odx__/me` returns sanitized SAP user context without raw token data.

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

- `.nuxt/odx/temp/<service>.edmx` for generated Nuxt runtime/build state.
- `.odx/cache/<service>.edmx` as a persistent local fallback cache across
  `.nuxt` cleanup.

Both locations are local generated artifacts. Do not commit them unless a future
release intentionally changes that policy. If stale metadata causes local type
generation or runtime schema checks to disagree with the backend, delete
`.nuxt/odx/temp/` first. Delete the matching `.odx/cache/<service>.edmx` file as
well only when you want the next prepare/build to refetch metadata instead of
using the local fallback.

Production Explorer metadata refresh is not TypeScript SDK generation. It
updates cached EDMX state for schema inspection only and never runs `odata2ts`
or writes generated TypeScript files in the deployed Nitro runtime. Generated
SDK files remain development/build/CI artifacts and require a new deployment to
change application types.

## Operational Checks

Before deployment-sensitive changes, run the relevant checks:

```bash
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm --filter odx-approuter run verify
pnpm run build:deployment
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
