# ADR: Production Explorer Runtime APIs

Status: proposed
Date: 2026-05-07

## Context

ODX has two Explorer delivery modes:

- Nuxt DevTools integration during local development.
- A standalone `@bc8-odx/explorer` app deployed behind the SAP BTP approuter.

The standalone Explorer should support runtime inspection in deployed BTP
environments. TypeScript SDK generation remains development/build-time, but
runtime service config, schema browsing, metadata refresh, traffic logs, user
context, and health state should work after deployment.

Current gaps:

- `/__odx__/config` can expose raw service config fields that are too sensitive
  for production Explorer responses.
- `/__odx__/schema` uses `.nuxt/odx/temp` as runtime cache storage and does not
  consistently use the same BTP destination/auth/header resolution as normal
  proxy requests.
- `/__odx__/generate` mixes metadata refresh with TypeScript SDK generation.
- Explorer traffic logs are in-memory development state.
- Explorer calls `/__odx__/mockdata`, but no matching backend route is
  registered.
- The standalone Explorer assumes same-origin `/__odx__` APIs.

The operator prefers trying `db0` for provider-agnostic persistence even though
it is early-stage. `evlog` remains attractive for structured operational logs,
but it should not replace Explorer-owned queryable traffic history.

## Decision

Use a small ODX-owned runtime boundary:

- Introduce explicit production policy for `/__odx__` endpoints before adding
  persistence or metadata refresh.
- Store Explorer traffic history behind an `OdxLogStore` interface.
- Use `db0` as the first persistent implementation behind that interface.
- Keep an in-memory store for development and tests.
- Treat `evlog` as optional future operational logging, not as the Explorer log
  store.
- Split production metadata refresh from TypeScript SDK generation.
- Use runtime metadata cache state for schema/config Explorer views.
- Keep SDK/type generation limited to development, build, or CI workflows.

## Consequences

Benefits:

- The deployed Explorer can inspect runtime service state without relying on
  local `.nuxt` build artifacts.
- Production traffic history can be queryable, bounded, redacted, and
  provider-agnostic.
- BTP can use a real SQL backing service through db0 instead of ephemeral app
  filesystem state.
- evlog can still be added later for one-event-per-request platform
  observability without changing Explorer storage.

Tradeoffs and risks:

- This touches high-risk surfaces: auth, endpoint exposure, persistence,
  redaction, metadata cache policy, and deployment configuration.
- db0 is early-stage, so ODX must keep a narrow adapter boundary and avoid
  leaking db0-specific APIs into Explorer or public package contracts.
- Production logs may contain sensitive request/response data unless redaction
  and retention are implemented before enabling persistent storage.
- Runtime metadata refresh cannot guarantee application code compatibility when
  the backend schema changes. TypeScript SDK changes still require CI/build and
  a new deployment.

## Alternatives Considered

- Use in-memory logs only: simple, but not durable or multi-instance safe in
  BTP.
- Use evlog only: good for operational structured events, but not enough for
  Explorer list/filter/detail/clear/retention workflows without another store.
- Write a custom database layer: more control, but unnecessary while db0 can be
  isolated behind an adapter.
- Keep `/__odx__/generate` as the production refresh endpoint: confusing,
  because generation means TypeScript SDK output while production only refreshes
  metadata/cache state.

## Promotion

If accepted through implementation, promote the runtime Explorer policy to
`ARCHITECTURE.md`, `API.md`, `SECURITY.md`, and `DEPLOYMENT.md`.
