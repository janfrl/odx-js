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
| `fetchList(query?, options?)` | `GET` | `Promise<T[]>` |
| `get(key, query?, options?)` | `GET` | Nuxt `AsyncData<T>` compatible promise |
| `create(body)` | `POST` | `Promise<T>` |
| `update(key, body)` | `PATCH` | `Promise<T>` |
| `remove(key)` | `DELETE` | `Promise<unknown>` |

Use `list` during Nuxt setup when SSR-aware `AsyncData` is desired. Use
`fetchList` for imperative controller effects; it forwards cancellation and
other request options to the configured ODX transport.

Keys may be strings, numbers, or composite key objects.

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
