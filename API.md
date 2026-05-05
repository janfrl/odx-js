# API

This file summarizes the durable public and internal contracts. Detailed user
guides and generated type reference live in `docs/content`.

## Nuxt Module

Install and register `@bc8-odx/nuxt` in `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: ['@bc8-odx/nuxt'],
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
| `rejectUnauthorized` | TLS certificate validation for metadata/backend calls. | module default is `false` |
| `forwardAuthHeader` | Forward incoming Authorization header through ODX. | `true` |
| `services` | Configured OData service definitions. | `[]` |
| `btpConfigService` | User-provided service name for BTP config overrides. | `odx-config` |
| `devtools.enabled` | Enable the Explorer in Nuxt DevTools during development. | `true` |
| `devtools.maxLogs` | Maximum in-memory traffic log entries. | `100` |

Only safe public fields are exposed through `runtimeConfig.public.odata`. Secrets
must stay in private runtime config, environment variables, or BTP services.

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

`NUXT_ODATA_REJECT_UNAUTHORIZED=false` is a runtime disable switch. To require
TLS certificate validation, configure `odata.rejectUnauthorized: true` in Nuxt
module options.

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

Entity-set methods:

| Method | HTTP | Return |
| --- | --- | --- |
| `list(query?, options?)` | `GET` | Nuxt `AsyncData<T[]>` compatible promise |
| `get(key, query?, options?)` | `GET` | Nuxt `AsyncData<T>` compatible promise |
| `create(body)` | `POST` | `Promise<T>` |
| `update(key, body)` | `PATCH` | `Promise<T>` |
| `remove(key)` | `DELETE` | `Promise<unknown>` |

Keys may be strings, numbers, or composite key objects.

## Proxy Package

`@bc8-odx/proxy` exports:

- `createODataHandler(config)` for standalone H3 usage.
- `odataGuard(ctx)` and `ODataGuard` rule utilities.
- OData client/log/CSRF helpers re-exported from core.

The Nitro module is available as `@bc8-odx/proxy/nitro`.

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

| Endpoint | Purpose |
| --- | --- |
| `/__odx__/config` | Resolved service config, entities, versions, and generation status. |
| `/__odx__/logs` | Development traffic logs. `DELETE` clears logs. |
| `/__odx__/generate?service=<name>` | Regenerates SDK/types for one service. |
| `/__odx__/schema?service=<name>` | Parsed EDMX schema; `raw=true` returns XML. |
| `/__odx__/types?service=<name>` | Generated TypeScript model files. |
| `/__odx__/me` | Current user info from SAP security context or local fallback. |

Do not expose secrets from these endpoints. Treat them as development and
authenticated tool surfaces, not public product APIs.
