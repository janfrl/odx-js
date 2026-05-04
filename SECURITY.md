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

## Authentication

In production, proxy routes are expected to be protected by SAP XSUAA through
the approuter and proxy Nitro plugins.

Relevant behavior:

- `packages/approuter/xs-app.json` requires XSUAA for `/api/odx/*` and
  `/explorer/*`.
- `packages/proxy/src/plugins/auth-btp.ts` validates SAP security context for
  `/api/*` and `/__odx__/*` when `NODE_ENV=production`, `VCAP_SERVICES` exists,
  and XSUAA credentials are available.
- `packages/proxy/src/api/odata.ts` also validates BTP auth in production.
- `/__odx__/me` returns the official SAP security context when available,
  decodes a bearer token as fallback, and returns a synthetic local user only
  outside production.

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

If headers are displayed or stored, consider redacting sensitive values such as:

- `authorization`
- `cookie`
- `set-cookie`
- API keys
- SAP session tokens

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
