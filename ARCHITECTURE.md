# Architecture

ODX is a pnpm monorepo for building, proxying, generating, and inspecting OData
integrations in Nuxt and SAP BTP environments.

The durable architectural rule is separation of concerns:

- `@bc8-odx/core` owns framework-agnostic OData types and utilities.
- `@bc8-odx/proxy` owns server-side request handling, BTP integration, policy
  enforcement, telemetry, and internal Explorer endpoints.
- `@bc8-odx/nuxt` owns Nuxt module registration, runtime config resolution,
  auto-imported composables, type generation, and DevTools integration.
- `@bc8-odx/explorer` owns the browser UI for schema, traffic, entity, and proxy
  inspection.
- `docs` owns the Docus documentation site and API-reference extraction.
- `playground` is the local integration surface for development and examples.
- `packages/approuter` is the SAP approuter entry point for deployed access.

## Package Boundaries

### `packages/core`

Core must stay free of Nuxt, Nitro, Vue, and browser UI concerns. It exposes:

- OData configuration and domain types from `src/types.ts`.
- OData helpers such as `$odata`, `flattenOData`, `stringifyQuery`,
  `mergeHeaders`, and `sanitizeBaseURL`.
- EDMX parsing utilities from the `./server` export.
- CSRF-aware request support through `fetchWithCsrf`.
- In-memory development logs used by the proxy and Explorer.

Add low-level OData behavior here when it is useful outside Nuxt or Nitro.

### `packages/proxy`

Proxy is the server boundary between applications and OData backends. It exposes:

- `createODataHandler(config)` for standalone H3 usage.
- `@bc8-odx/proxy/nitro` for Nitro module registration.
- Proxied OData request handling under the configured `basePath`.
- Internal Explorer APIs under `/__odx__`.
- BTP destination and XSUAA integration.
- Declarative rules and Nitro hooks around outgoing proxy requests.

Keep proxy code framework-light. It may depend on H3/Nitro primitives, SAP BTP
packages, and core utilities, but it should not depend on Nuxt UI or Explorer UI
state.

### `packages/nuxt`

The Nuxt module is the host integration layer. Its setup flow is:

1. Resolve module options, environment overrides, and BTP user-provided service
   configuration.
2. Store private config in `runtimeConfig.odata`.
3. Store safe public config in `runtimeConfig.public.odata`.
4. Auto-import runtime composables.
5. Add the runtime server middleware that injects ODX config and hooks into H3
   events.
6. Register the proxy Nitro module.
7. Generate OData model and registry types during `prepare:types`.
8. Register the ODX Explorer as a Nuxt DevTools custom tab in development.

Nuxt module code should stay focused on Nuxt lifecycle integration. Reusable
OData behavior belongs in `core`; server request behavior belongs in `proxy`.

### `packages/explorer`

Explorer is a Nuxt UI application mounted in Nuxt DevTools at
`/__odx__/client/`. In local module development, the host module starts the
Explorer dev server on port `3300` and proxies DevTools traffic to it. In
published builds, a built client can be served directly.

Explorer reads from the internal proxy APIs:

- `/__odx__/config`
- `/__odx__/logs`
- `/__odx__/generate`
- `/__odx__/schema`
- `/__odx__/types`
- `/__odx__/me`

Explorer state is intentionally client-side and session-oriented. Durable
business rules, security behavior, and OData parsing logic do not belong in the
Explorer.

### `docs`

The documentation site extends Docus, uses Nuxt UI styling, and includes API
reference automation. Source guides live under `docs/content`. The root-level
documentation files describe repository-wide architecture and agent-relevant
constraints; the Docus content describes user-facing product guides.

## Runtime Flow

The normal Nuxt runtime path is:

1. Application code calls `useOData()`.
2. The composable builds a service/entity URL from public runtime config.
3. Proxied services call `basePath/service/entitySet`.
4. Nitro routes the request through `@bc8-odx/proxy/nitro`.
5. Proxy plugins resolve the target from an absolute URL, SAP BTP destination,
   or local SAP-style mock path.
6. The proxy prepares headers, applies hooks and declarative rules, then sends
   the request in stream or buffer mode.
7. Responses are returned to the application. In development, request telemetry
   is stored for the Explorer.

Direct services can be addressed by the browser, but the Explorer defaults to a
CORS bridge path for usability during development.

## Type Generation Flow

Type generation is driven by `packages/nuxt/src/generate.ts`:

1. During `prepare:types`, each configured service is inspected.
2. Remote service metadata is downloaded from `$metadata`; local service
   metadata is read from the configured EDMX file.
3. Remote EDMX files are cached in `.nuxt/odx/temp` and mirrored into
   `.odx/cache` so metadata can survive `.nuxt` cleanup.
4. `odata2ts` generates models into `.nuxt/odx-types/<service>`.
5. ODX writes an `index.d.ts` file that augments `ODataServiceRegistry`.
6. Nuxt receives that generated declaration as a type reference.

Agents changing generation must preserve the registry augmentation behavior,
because it is what powers typed `useOData().Service.EntitySet` access.

## Deployment Shape

The full SAP BTP deployment contains three Node.js modules:

- `odx-approuter`: authenticated entry point and route dispatcher.
- `odx-proxy`: Nitro-built OData proxy service.
- `odx-explorer`: Nitro-built Explorer UI.

The MTA binds:

- XSUAA for authentication and user attributes.
- Destination service for configured backend resolution.
- Connectivity service for on-premise destinations.

See `DEPLOYMENT.md` for operational details.

## Extension Points

Preferred extension points are:

- Nuxt `odata` module options for service configuration.
- Environment variables and BTP user-provided services for deployment-specific
  overrides.
- Declarative `rules` on service config for common proxy policy.
- Nitro hooks:
  - `odx:proxy:request`
  - `odx:proxy:request:<ServiceName>`
  - `odx:proxy:response`

Avoid adding ad hoc global state or parallel configuration systems. If a feature
changes OData behavior, place the durable contract in `core` or `proxy` first,
then expose it through the Nuxt module and Explorer as needed.
