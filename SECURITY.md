# Security

ODX sits between a browser or Nuxt application and one or more OData backends.
Most security-sensitive behavior is in `@me-tools/odx-proxy` and the SAP BTP
deployment configuration.

## Trust Boundaries

Important boundaries:

- Browser to Nuxt/Nitro host.
- Nuxt/Nitro host to ODX proxy handlers.
- ODX proxy to external OData service, BTP destination, or local mock route.
- AppRouter to proxy and Explorer in BTP.
- Explorer to internal `/__odx__` endpoints.
- Untrusted XML or JSON CSDL input to the framework-neutral metadata reader.

Do not treat Explorer endpoints as public APIs. They expose operational state
that is appropriate for authenticated development and inspection workflows.
Local Nuxt DevTools Explorer access is a developer convenience surface. The
deployed standalone Explorer is a production operations surface and must run
behind AppRouter/XSUAA and proxy-side SAP security-context validation.

## Authentication

In production, proxy routes are expected to be protected by SAP XSUAA through
the approuter and proxy Nitro plugins.

Relevant behavior:

- `packages/approuter/xs-app.json` requires XSUAA for proxied OData routes
  under `/api/odx/*`, Explorer UI routes `/explorer/*`, `/__odx__/client`, and
  `/__odx__/client/*`, and the supported proxy runtime API routes
  `/__odx__/{config,logs,schema,generate,types,me}`.
- `packages/proxy/src/plugins/auth-btp.ts` validates SAP security context for
  `/api/*` and `/__odx__/*` when `security.sapXsuaa` is explicitly enabled,
  `NODE_ENV=production`, `VCAP_SERVICES` exists, and XSUAA credentials are
  available. The adapter is Node-only and remains out of portable Nitro
  workers unless selected by the host.
- `packages/proxy/src/api/odata.ts` consumes a host-provided security context;
  it does not load a second authentication implementation.
- `/__odx__/me` returns the official SAP security context when available,
  decodes a bearer token as fallback outside production, and returns a
  synthetic local user only outside production. Production responses omit raw
  token data.

Development and production authentication are intentionally different:
development DevTools endpoints favor local debugging and may use local fallback
identity, while production `/__odx__` runtime APIs require SAP security context
before returning config, schema, logs, generation status, type artifacts, or
user information.

If authentication behavior changes, update `xs-security.json`,
`packages/approuter/xs-app.json`, and this file together.

Enable the SAP adapter only for a Node.js BTP deployment:

```ts
export default defineNuxtConfig({
  odata: {
    security: { sapXsuaa: true },
  },
})
```

## Authorization And Policy

Service-level `rules` can enforce common proxy policies:

- allowed or denied HTTP methods
- required XSUAA scopes
- required user attributes
- denied path fragments
- denied outgoing headers
- injected headers
- rewritten paths

Rules are applied to non-direct proxy flows before the outbound request is sent.
For complex policy, prefer Nitro hooks or `ODataGuard.validate` over scattering
authorization logic through UI components.

Production Explorer endpoints require an authenticated SAP security context
before returning runtime data. The current policy is authenticated-user only;
no additional XSUAA role or scope is defined for task 077. If a stricter
Explorer role is required later, add that as an explicit security decision and
update `xs-security.json`, AppRouter routes, proxy policy, and tests together.

Production `/__odx__/config` uses a whitelist and exposes only top-level
`basePath`, `mode`, and sanitized service entries with service name, route,
icon, strategy, proxy mode, entity metadata, generation state, and OData
version, plus sanitized runtime metadata state (`status`, `source`, `stale`,
`staleReason`, `refreshedAt`, `timestamp`, `hash`, `bytes`, and optional
`message`). It must not expose backend URLs, destinations, auth, outbound
headers, rules, unknown service fields, runtime paths, hooks, DevTools config,
TLS settings, global auth, global headers, `forwardAuthHeader`, or Node runtime
versions.

Production `/__odx__/schema` returns parsed cached metadata only and rejects raw
XML. Production `/__odx__/generate` refreshes runtime metadata cache state only
and must not run SDK generation. Production `/__odx__/types` is
development-only.
Production `/__odx__/logs` returns an empty list and rejects clearing unless
persistent SQL log storage is explicitly configured. With SQL storage enabled,
the proxy stores and serves redacted traffic history through `OdxLogStore`, and
production request/response payload bodies are omitted by default.

Production metadata inspection is not SDK generation. Runtime metadata refresh
may fetch `$metadata` through production-compatible service resolution, then
update cached EDMX state for Explorer views. It may fall back to stale cached
metadata, but production must not write generated TypeScript SDK files or imply
application type changes without a build and deployment.

## Header Handling

For non-direct requests, global header defaults are merged case-insensitively
with service defaults before `prepareProxyHeaders` applies filtered incoming
overrides. Normal absolute/relative proxied targets select service auth, falling
back to global auth only when the service profile is absent. Empty or partial
service profiles do not borrow global credential fields. Destination auth stays
independent, including when no credentials are returned. The direct bridge
inherits neither global headers nor computed server auth; explicitly configured
service headers and permitted incoming headers retain their existing behavior.

Ambient browser and reverse-proxy credentials are not
forwarded to OData backends: cookies, response cookies, forwarding metadata,
real-client IP metadata, hop-by-hop headers, and headers named by the incoming
`Connection` header are removed. An explicitly configured service `Cookie`
header remains available for legacy backends.

Incoming `Authorization` is forwarded only when `forwardAuthHeader` is not
`false`. Authentication resolved from service config or a BTP destination
always overrides the final `Authorization` header.

Streaming enforces that same cleaned header set at the final fetch dispatch.
H3's convenience proxy merges incoming headers by default, so merely omitting a
cookie, disabled Authorization or hop-by-hop header from proxy options is not a
security boundary. ODX replaces those merged headers before the backend fetch,
including when using the Connectivity transport. Explicit backend cookies,
computed auth and CSRF session headers remain available; original browser
credentials are not restored. This does not change host authentication, XSUAA
scopes or AppRouter access rules.

Production BTP destination resolution fails closed. Missing Destination or
XSUAA bindings, an unavailable Destination service, and invalid destination
URLs reject the proxy request instead of routing it to the local SAP mock
prefix. The relative fallback remains available only when `NODE_ENV` is
explicitly `development` or `test`; unset and custom deployment environments
fail closed.

Absolute configured and Destination-provided backend bases are parsed as
HTTP(S) URLs before proxy dispatch. URL userinfo and backslashes are rejected,
and fragments are removed; authentication remains in the owned header contract.
A configured query is allowed for SAP routing parameters, retained byte-for-byte,
and placed after the appended service resource path rather than being mistaken
for part of that path.

Nuxt validates direct-service URLs before copying them into browser-visible
runtime config, and validates remote metadata URLs before starting build-time
transport. URL userinfo, backslashes, surrounding whitespace, and control
characters fail with a sanitized service-scoped error; direct fragments also
fail rather than entering the client payload. Use explicit auth configuration
instead of URL-embedded credentials.

On-premise destinations also fail closed when the Connectivity binding or its
declared HTTP proxy endpoint is missing or invalid. Connectivity access tokens
are used only as the proxy authorization credential and are never forwarded as
ordinary backend headers. User tokens become
`SAP-Connectivity-Authentication` only for destinations explicitly declaring
`Authentication=PrincipalPropagation`; ordinary destinations do not receive
that header.

Restricted hop-by-hop headers include:

- `host`
- `connection`
- `content-length`
- `content-encoding`
- `transfer-encoding`
- `keep-alive`
- `proxy-authenticate`
- `proxy-authorization`
- `te`
- `trailers`
- `upgrade`

Be careful when adding new forwarded headers. Headers can carry identity,
tenant, routing, or credential material.

## Secrets

Never commit:

- Basic auth credentials
- bearer tokens
- XSUAA credentials
- destination service credentials
- `default-env.json`
- `.env`
- tenant-specific backend URLs that are not intended as examples
- generated local data that may contain customer payloads

Use environment variables, BTP service bindings, or user-provided services for
deployment-specific values.

## CSRF

Proxied SAP services can enable a request-scoped CSRF preflight for `POST`,
`PUT`, `PATCH`, `MERGE`, and `DELETE` with `csrf: { mode: 'sap' }`. The default `HEAD`
request sends `x-csrf-token: Fetch`; services that require a read request can
select `GET`.
The returned token and all session cookies are forwarded only to the matching
backend mutation. They are not exposed in browser runtime config or DevTools
request-header logs, and backend `Set-Cookie` headers are not forwarded to the
browser. A missing token fails closed before the mutation is sent.

The generic OData default is `csrf: { mode: 'none' }`, so existing non-SAP
services remain unchanged. Direct services do not use the server-side CSRF
flow. ODX currently performs a fresh preflight for each protected mutation; it
does not cache tokens across requests or automatically replay a rejected
mutation.

`prepareSapCsrfHeaders` owns the server/edge token/session preparation contract,
and `fetchWithCsrf` provides the matching imperative server/edge request helper.
Browsers cannot read `Set-Cookie` or set a `Cookie` request header, so client
code must use the proxy instead. The proxy uses the preparation contract for
both buffered and streamed responses so
hooks, rules, ETags, and response handling remain on the normal proxy path.

Changes to mutation handling must preserve SAP CSRF behavior for OData V2 and
V4 services.

## TLS

The Nuxt module defaults `rejectUnauthorized` to `true`. Metadata and backend
connections therefore validate TLS certificates unless an operator explicitly
opts out for a development system.

Development systems with certificates unavailable to the local trust store can
opt out explicitly:

```ts
export default defineNuxtConfig({
  odata: {
    rejectUnauthorized: false,
  },
})
```

`NUXT_ODATA_REJECT_UNAUTHORIZED=false` is available as a runtime disable switch;
never use that override as a production default.

## Logging And Telemetry

Development logging stores OData traffic in memory for Explorer inspection
through the core `OdxLogStore` boundary. The default store is
`OdxMemoryLogStore`; the proxy also has an opt-in SQL store implemented with
db0 behind the same append, update, list, get, clear, and retention-friendly
query behavior without bypassing redaction.
Logs may include:

- request URLs
- service and entity names
- request bodies for mutating methods
- response bodies in buffer mode
- request headers
- proxy trace details

`DevToolsTracer` disables memory-only logging when `NODE_ENV=production`.
Explicit persistent SQL storage is the exception described below; production
payload bodies remain omitted. Do not add production payload logging without
a documented security review.

Operational telemetry uses a separate allowlisted summary and must never copy
request context, URLs, query literals, entity keys, headers, bodies, backend
errors, or `proxyTrace.details`. Treat client-provided operation identifiers as
untrusted; the proxy bounds their length and character set before publishing
them. Observability adapters may add stronger redaction but must not weaken the
ODX allowlist. Adapter or drain failure must not change the OData response.

Headers are redacted before storage when their names contain or match sensitive
credential/session material, including:

- `authorization`
- `proxy-authorization`
- `cookie`
- `set-cookie`
- API keys
- SAP session tokens
- CSRF/XSRF tokens

New and updated log records also redact URL userinfo and known credential
query/fragment values in request/target URLs, trace messages and nested trace
strings. Credential-name matching handles percent encoding, case, camelCase
and underscores; undecodable parameter names have their values redacted.
Query or fragment values containing fully or partially percent-encoded URL
userinfo are redacted as a whole, including when another percent escape in the
same value is malformed. Repeated encoding is decoded only to a fixed bound;
credential parameter names and encoded URL delimiters still nested beyond that
bound are redacted rather than consuming unbounded diagnostic work.
Ordinary OData query bytes remain available for diagnostics. This transforms
only log copies, not backend URLs or requests, and still applies when payload
logging is disabled. Custom stores must honor the same sanitization boundary.

This is not general-purpose data-loss prevention: business query literals,
enabled payload previews and credentials hidden under unknown parameter names
may remain sensitive. Existing SQL rows and exported logs are not retroactively
rewritten or deleted. Review previously retained diagnostics under the host's
retention and credential-response policy; do not treat upgrading as erasing
earlier exposure.

Development logs must also limit or truncate large request and response bodies
before they are displayed, retained, exported, or copied into fixtures. The
default payload policy stores bounded previews locally, omits payloads when
`devtools.logPayloads` is `false`, and replaces payloads larger than
`devtools.maxPayloadBytes` with an ODX truncation marker containing byte counts
and a preview. Treat request bodies, response bodies, outbound headers,
auth/session/CSRF data, and proxy traces as potentially sensitive even when
they are local-only.

Production Explorer traffic history is disabled unless persistent SQL storage
is explicitly configured. When `devtools.logStore.provider` or
`NUXT_ODATA_DEVTOOLS_LOG_STORE` selects `sql`, production proxy tracing stores
redacted request metadata and proxy traces through `OdxLogStore`; request and
response payload bodies are omitted by default in production even when
`devtools.logPayloads` is enabled for local development. Without SQL storage,
`/__odx__/logs` returns an empty list and rejects clearing.

## Direct Strategy

`strategy: 'direct'` is intended for browser-accessible services and local
inspection workflows. It skips some proxy auth behavior and may rely on browser
CORS.

Use `proxied` for SAP BTP, server-side credential handling, policy enforcement,
and private backend access.

## Generated And Cached Data

Generated models and cached EDMX files can reveal backend schema. Treat
`.odx/cache` and `.nuxt/odx*` as generated local artifacts unless explicitly
published as examples.

Do not commit generated cache files from customer systems.

Metadata parsing is an untrusted-input boundary. The XML reader must keep DTD
and entity declarations disabled, perform no external resolution, reject
unknown entities, and retain nesting limits. Parser security changes require
focused malformed-input and resource-limit tests.

## Review Triggers

Require focused security review when a change touches:

- authentication or XSUAA validation
- BTP destination resolution
- Authorization header forwarding
- service `rules`
- request/response logging
- CSRF behavior
- TLS validation
- generated metadata cache policy
- metadata parsing, entity handling, or resource limits
- `/__odx__` endpoint exposure
