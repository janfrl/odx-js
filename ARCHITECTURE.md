# Architecture

ODX is a pnpm monorepo for building, proxying, generating, and inspecting OData
integrations in Nuxt and SAP BTP environments.

The durable architectural rule is separation of concerns:

- `@me-tools/odx-metadata` owns loss-aware, framework-neutral XML and JSON CSDL
  ingestion and its versioned document contract.
- `@me-tools/odx-core` owns framework-agnostic OData types and utilities.
- `@me-tools/odx-proxy` owns server-side request handling, BTP integration, policy
  enforcement, telemetry, and internal Explorer endpoints.
- `@me-tools/odx-nuxt` owns Nuxt module registration, runtime config resolution,
  auto-imported composables, type generation, and DevTools integration.
- `@me-tools/odx-explorer` owns the browser UI for schema, traffic, entity, and proxy
  inspection.
- `docs` owns the Docus documentation site and API-reference extraction.
- `playground` is the local integration surface for development and examples.
- `packages/approuter` is the SAP approuter entry point for deployed access.

## Nuxt Fiori Integration Contract

ODX is the protocol and transport foundation for Nuxt Fiori, but it remains a
general OData toolkit and must not import Fiori semantics. Nuxt Fiori owns
annotation-derived application behavior; ODX owns loss-aware metadata,
protocol-safe request construction, concrete transports, proxy policy, and
backend integration.

The first cross-repository contract is now executable rather than aspirational.
A clean temporary consumer installs packed artifacts from both repositories,
parses CSDL through `odx-metadata`, builds its Nuxt application, and exercises
reads, relative navigation, updates, atomic changesets, and canonical draft
operations through the production ODX proxy. Nuxt Fiori CI repeats that
consumer against public ODX `main` after its ordinary product verification,
and ODX CI runs the same consumer against the ODX checkout under test on Node
24. The consumer contract is implemented once while both change directions are
protected before merge.

Nuxt Fiori still declares `@me-tools/odx-nuxt` as a peer and retains a thin
structural entity-set port so its framework-neutral packages do not depend on a
Nuxt transport. ODX now names the portable imperative request-options contract
and its analytical `$apply` query member. The clean packed consumer proves
shared request-option compatibility, exact key, navigation-source, and
atomic-mutation compatibility, as well as entity-set assignability across the
public package boundary.
Published shared types, removal of the remaining metadata mirror, and a
released-version compatibility matrix remain prerequisites for the first public
prerelease. Fixture and ODX transports must continue to run in parallel until
their public behavior agrees.

Reusable OData key, resource-path, query, and batch construction belongs in
`odx-core`; HTTP execution, Nuxt `AsyncData`, runtime configuration, and
cancellation adaptation belong in `odx-nuxt`. Moving those protocol operations
does not make core a transport client. The portable imperative entity-set
surface and the Nuxt setup-time `AsyncData` surface should remain distinguishable
so non-Nuxt consumers do not need to emulate Vue-shaped contracts.

`odx-metadata` is the target CSDL ingestion implementation. The core `./server`
entry now exposes an explicit CSDL-document compatibility adapter, with corpus
characterization for V2/V4 versions and entities, V2 associations, navigation,
aliases, and duplicate local type names. Explorer schema/config endpoints and
Nuxt type generation consume that adapter; graph summaries are derived from the
parsed document rather than reparsing XML with regular expressions. The older
regex/file extractor now has no production callers and remains temporarily as a
compatibility API until a broader customer corpus proves equivalent behavior.
It must not evolve into a second semantic parser.

ODX and Nuxt Fiori remain separate repositories and release independently.
They should share provenance and compatibility discipline, not lockstep
versions. If the packed-consumer contract cannot be kept continuously green,
the separation is no longer earning its integration cost and a shared workspace
should be reconsidered.

The allowlisted ODX telemetry summary and `operationId` correlation seam are the
shared observability contract. evlog may be provided by a host adapter, but it
must not become a dependency of metadata, core, Nuxt Fiori semantics, or a
renderer.

Portable proxy handling and SAP host authentication are separate runtime
concerns. The base Nitro integration registers portable request routing on all
supported Nitro targets. SAP XSUAA validation is an explicit Node-only adapter
selected with `security.sapXsuaa`; its SDK must not enter edge-worker bundles.
The proxy handler consumes the resulting security context without loading a
second authentication implementation.

## Package Boundaries

### `packages/metadata`

Metadata is the ingestion boundary for semantic tooling. It exposes:

- namespace-aware XML and token-aware JSON CSDL readers with structured diagnostics
- a JSON-serializable, source-ordered document model with provenance and stable IDs
- shallow schema/member discovery for both representations
- representation-aware facet helpers such as `resolveCsdlNullable`
- versioned serialization, canonicalization, source hashing, and document hashing

Metadata must stay free of transport, Nuxt, Vue, Nitro, SAP UI, and generated
client concerns. It preserves unknown and legacy constructs rather than silently
normalizing them. It is not yet a linked semantic resolver and does not replace
the established EDMX helpers used by current core, generation, or Explorer
flows. Consumers may adopt it behind explicit adapter boundaries while the
conformance corpus matures.

### `packages/core`

Core must stay free of Nuxt, Nitro, Vue, and browser UI concerns. It exposes:

- OData configuration and domain types from `src/types.ts`.
- OData helpers such as `$odata`, `flattenOData`, `stringifyQuery`,
  `mergeHeaders`, and `sanitizeBaseURL`.
- Validated, service-relative OData key, entity, navigation, action, and typed V4 function path
  construction plus relationship references and default or named media-stream
  `$value` paths, while service-root resolution and transport remain adapters.
- Multipart serialization and response parsing for atomic OData V4 writes and
  ordered independent changesets whose partial outcomes remain explicit.
- EDMX parsing utilities from the `./server` export.
- CSRF-aware request support through `fetchWithCsrf`.
- The `OdxLogStore` traffic-log boundary, default in-memory store, redaction
  helpers, and bounded payload utilities used by the proxy and Explorer.

Add low-level OData behavior here when it is useful outside Nuxt or Nitro.

### `packages/proxy`

Proxy is the server boundary between applications and OData backends. It exposes:

- `createODataHandler(config)` for standalone H3 usage.
- `@me-tools/odx-proxy/nitro` for Nitro module registration.
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

The runtime composable maps typed service-level actions, root updates,
contained-entity mutations and media streams, and non-contained relationship
links to framework-neutral atomic or independent changesets and owns service
URL resolution plus `$batch` transport.
Ordinary service-, collection-, entity-, and navigation-bound actions expose a
capability-negotiated response-aware path alongside the body-only API so
optional representations, ETags, and allowlisted SAP mutation feedback can
cross the same structural Nuxt Fiori transport boundary.
Root and structured navigation DELETEs follow the same additive pattern through
`supportsDeleteResponses`, `removeWithResponse`, and
`removeNavigationWithResponse`; existing body-only removal ports stay valid.
Non-contained `$ref` links follow that boundary as well: response-aware link
and unlink methods preserve optional representations, ETags, and allowlisted
SAP feedback behind `supportsNavigationReferenceResponses`, while the original
relationship API stays structurally compatible.
Imperative media creates and replacements keep binary payloads outside SSR
state while retaining the same allowlisted SAP mutation feedback as JSON
mutations; higher semantic layers own parsing and presentation.

Nuxt module code should stay focused on Nuxt lifecycle integration. Reusable
OData behavior belongs in `core`; loss-aware CSDL ingestion belongs in
`metadata`; server request behavior belongs in `proxy`.

### `packages/explorer`

Explorer has two delivery modes:

- In local Nuxt development, it is embedded as a Nuxt DevTools tab at
  `/__odx__/client/`. The host module starts the Explorer dev server on port
  `3300` and proxies DevTools traffic to it.
- In SAP BTP production deployments, it is a standalone Nitro-built browser app
  served by the `odx-explorer` module behind the AppRouter. AppRouter routes
  `/__odx__/client` and `/__odx__/client/*` to the Explorer UI, and narrowly
  routes only `/__odx__/{config,logs,schema,generate,types,me}` to the proxy
  runtime API.

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

No `/__odx__/mockdata` endpoint is registered. Mock fixture files remain a
local development workspace concern.

Current production behavior:

- `/__odx__` endpoints are a proxy-owned runtime boundary behind validated SAP
  security context.
- `/__odx__/config` uses a whitelist response: top-level `basePath`, `mode`,
  and `services`; each service entry is limited to `name`, `route`, `icon`,
  `strategy`, `proxyMode`, `entities`, `isGenerated`, `version`, and
  `metadata`. The `metadata` object is limited to runtime cache state:
  `status`, `source`, `stale`, `staleReason`, `refreshedAt`, `timestamp`,
  `hash`, `bytes`, and optional `message`.
- Production config omits backend URLs, destinations, auth, outbound headers,
  rules, unknown service fields, global secrets, runtime paths, hooks, DevTools
  config, `forwardAuthHeader`, and `versions.node`.
- `/__odx__/schema` returns parsed cached schema only and rejects raw XML.
- `/__odx__/generate` refreshes runtime metadata cache state in production.
  It fetches `$metadata` through the same production-compatible service
  resolution used for backend access, records timestamp/hash details, and falls
  back to stale cached metadata when the backend is unreachable.
- `/__odx__/types` is development-only and returns `403` in production.
- `/__odx__/logs` returns an empty list and rejects `DELETE` in production
  unless SQL log storage is explicitly configured. When configured, the proxy
  stores and serves redacted traffic history through `OdxLogStore`; Explorer
  never talks to db0 or a database directly.
- `/__odx__/me` returns sanitized SAP user context without raw token data.

Runtime metadata refresh is separate from TypeScript SDK generation. Production
can refresh metadata cache state for Explorer schema/config views, but SDK/type
file generation remains a development, build, or CI workflow that requires a
new deployment to affect application code. Production traffic history is
disabled by default; local development and tests remain memory-backed. SQL
persistence is available through a proxy-owned db0 adapter only when
`devtools.logStore` or the matching environment variables select SQL storage.

### `docs`

The documentation site extends Docus, uses Nuxt UI styling, and includes API
reference automation. Source guides live under `docs/content`. The root-level
documentation files describe repository-wide architecture and contributor
constraints; the Docus content describes user-facing product guides.

## Runtime Flow

The normal Nuxt runtime path is:

1. Application code calls `useOData()`.
2. The composable builds a service/entity URL from public runtime config.
3. Proxied services call `basePath/service/entitySet`.
4. Nitro routes the request through `@me-tools/odx-proxy/nitro`.
5. Proxy plugins resolve the target from an absolute URL, SAP BTP destination,
   or local SAP-style mock path.
6. The proxy prepares headers, applies hooks and declarative rules, then sends
   the request in stream or buffer mode.
7. Responses are returned to the application. In development, request telemetry
   is stored for the Explorer.

When enabled, each completed proxy request publishes an allowlisted operational summary
through `odx:proxy:telemetry`. The summary is independent from development log
storage and contains correlation IDs, semantic service/entity-set identifiers,
method, proxy mode, target kind, status, outcome, and duration only. Nuxt hosts
may project it into an observability system. Portable ODX packages do not
depend on a logging vendor, and Explorer remains the owner of detailed traces.

Development telemetry is still a sensitive surface. Traffic logs now pass
through the core `OdxLogStore` boundary before storage. The default store is
memory-backed for local development and tests, supports append, update, list,
get, clear, and retention-friendly filters, and redacts or bounds sensitive log
fields before persisting entries. Outbound headers, auth/session/CSRF material,
and large request or response bodies must be redacted or bounded before they
are displayed, stored, exported, or copied into tests. A proxy-owned db0 SQL
store can be selected for deployed Explorer traffic history, but production
payload logging remains disabled by default.

Direct services can be addressed by the browser, but the Explorer defaults to a
CORS bridge path for usability during development.

## Type Generation Flow

TypeScript SDK generation is driven by `packages/nuxt/src/generate.ts`:

1. During `prepare:types`, each configured service is inspected.
2. Remote service metadata is downloaded from `$metadata`; local service
   metadata is read from the configured EDMX file.
3. Remote EDMX files are cached in `.nuxt/odx/temp` and mirrored into
   `.odx/cache` so metadata can survive `.nuxt` cleanup.
4. `odata2ts` generates models into `.nuxt/odx-types/<service>`.
5. ODX writes an `index.d.ts` file that augments `ODataServiceRegistry`.
6. Nuxt receives that generated declaration as a type reference.

Changes to generation must preserve the registry augmentation behavior,
because it is what powers typed `useOData().Service.EntitySet` access.

Runtime metadata refresh is a separate concern from SDK generation. Production
Explorer endpoints do not regenerate `.nuxt/odx-types` files and do not update
deployed application types. The runtime refresh path updates cached EDMX state
for Explorer inspection only and returns stale/timestamp/hash details so
operators can see whether live metadata or cached metadata was used.

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
