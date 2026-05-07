# Security

ODX sits between a browser or Nuxt application and one or more OData backends.
Most security-sensitive behavior is in `@bc8-odx/proxy` and the SAP BTP
deployment configuration.

## Trust Boundaries

Important boundaries:

- Browser to Nuxt/Nitro host.
- Nuxt/Nitro host to ODX proxy handlers.
- ODX proxy to external OData service, BTP destination, or local mock route.
- AppRouter to proxy and Explorer in BTP.
- Explorer to internal `/__odx__` endpoints.

Do not treat Explorer endpoints as public APIs. They expose operational state
that is appropriate for authenticated development and inspection workflows.
Local Nuxt DevTools Explorer access is a developer convenience surface. The
deployed standalone Explorer is a production operations surface and must run
behind AppRouter/XSUAA and proxy-side SAP security-context validation.

## Authentication

In production, proxy routes are expected to be protected by SAP XSUAA through
the approuter and proxy Nitro plugins.

Relevant behavior:

- `packages/approuter/xs-app.json` requires XSUAA for `/api/odx/*` and
  `/__odx__/*` on the proxy and `/explorer/*` on the Explorer UI.
- `packages/proxy/src/plugins/auth-btp.ts` validates SAP security context for
  `/api/*` and `/__odx__/*` when `NODE_ENV=production`, `VCAP_SERVICES` exists,
  and XSUAA credentials are available.
- `packages/proxy/src/api/odata.ts` also validates BTP auth in production.
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
version. It must not expose backend URLs, destinations, auth, outbound headers,
rules, unknown service fields, runtime paths, hooks, DevTools config, TLS
settings, global auth, global headers, `forwardAuthHeader`, or Node runtime
versions.

Production `/__odx__/schema` returns parsed cached metadata only and rejects raw
XML. Production `/__odx__/generate` and `/__odx__/types` are development-only.
Production `/__odx__/logs` returns an empty list and rejects clearing until a
persistent log and redaction policy is implemented.

Production metadata inspection is not SDK generation. Current production
behavior can read cached parsed metadata for Explorer views only. A planned
runtime metadata refresh endpoint may update runtime cache state later, but
production must not write generated TypeScript SDK files or imply application
type changes without a build and deployment.

## Header Handling

`prepareProxyHeaders` merges service headers and incoming request headers, then
removes restricted hop-by-hop headers:

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

An auth header resolved from service config or BTP destination overrides the
final `authorization` header.

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

`fetchWithCsrf` performs a HEAD preflight with `x-csrf-token: Fetch` for
mutating methods and forwards the returned token and session cookies to the
final request.

Changes to mutation handling must preserve SAP CSRF behavior for OData V2 and
V4 services.

## TLS

The Nuxt module currently defaults `rejectUnauthorized` to `false` unless the
option or environment forces stricter behavior. This is convenient for SAP
development landscapes with self-signed certificates but is weaker than normal
production TLS validation.

For production deployments, prefer validating certificates and set:

```ts
export default defineNuxtConfig({
  odata: {
    rejectUnauthorized: true,
  },
})
```

`NUXT_ODATA_REJECT_UNAUTHORIZED=false` is available as a runtime disable switch;
do not rely on it to turn validation on when module config leaves the option at
its default.

## Logging And Telemetry

Development logging stores OData traffic in memory for Explorer inspection.
Logs may include:

- request URLs
- service and entity names
- request bodies for mutating methods
- response bodies in buffer mode
- request headers
- proxy trace details

`DevToolsTracer` disables logging when `NODE_ENV=production`. Preserve that
behavior. Do not add production payload logging without a documented security
review.

If headers are displayed or stored in development, redact sensitive values such
as:

- `authorization`
- `cookie`
- `set-cookie`
- API keys
- SAP session tokens

Development logs must also limit or truncate large request and response bodies
before they are displayed, retained, exported, or copied into fixtures. Treat
request bodies, response bodies, outbound headers, auth/session/CSRF data, and
proxy traces as potentially sensitive even when they are local-only.

Production Explorer traffic history is currently disabled by policy:
`/__odx__/logs` returns an empty list and rejects clearing. The planned
db0-backed `OdxLogStore` follow-up must define production redaction, payload
limits, retention, and clear behavior before enabling persisted traffic
history.

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
- `/__odx__` endpoint exposure
