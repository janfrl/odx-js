# Review: Separate runtime metadata refresh from SDK generation

Status: complete
Date: 2026-05-08
Reviewer: Codex
Task: `.agents/tasks/done/080-separate-runtime-metadata-refresh-from-sdk-generation.md`
Reviewed commit: `464ae4c1764bc8cd1272b5753b5f985880dbfa46`
Decision: approved after focused re-review

## Findings

Focused re-review findings after Integrator commit
`ea55184855ea656bacb738819a430e2b9813d252`: none.

Original finding, now resolved:

1. [P1] Direct-service metadata refresh can send configured credentials that
   normal direct proxy access intentionally skips:
   `packages/proxy/src/utils/metadata-refresh.ts:166`. The metadata refresh
   path calls `target.authHeader || resolveConfiguredAuthHeader(service,
   config)`, so when `resolveProxyTarget` returns an empty auth header for a
   `strategy: "direct"` absolute-URL service, refresh falls back to
   service/global Basic or Bearer credentials and sends them on the server-side
   `$metadata` request. That diverges from the target resolver's direct-service
   behavior in `packages/proxy/src/utils/target.ts:30`, where managed auth is
   deliberately skipped for direct services. This matters in production because
   task 080 newly enables `/__odx__/generate` as a runtime refresh endpoint:
   a browser-accessible direct backend can receive ODX-managed credentials that
   normal direct proxy access would not attach. Fix by preserving the resolved
   target's auth semantics for direct targets. For example, only use configured
   auth fallback when the resolved target is not direct, or move global/auth
   resolution into the shared target resolver so direct/proxied behavior stays
   consistent. Add a focused regression test for a direct absolute-url service
   with service or global auth asserting production metadata refresh does not
   send that configured Authorization header.

## Acceptance Criteria

- [x] Production can refresh metadata without invoking `odata2ts`: pass.
  Production returns `operation: "metadata-refresh"` and `generated: false`;
  the injected generator is not called and `.nuxt/odx/generated` is not
  created in the focused test.
- [x] Development can still regenerate SDK/types for a service: pass.
  Development refreshes metadata first and invokes the injected Nuxt generator
  with the refreshed EDMX path and output directory.
- [x] Refresh results include clear status, stale state, and timestamp/hash
  information: pass.
- [x] Metadata fetching uses production-compatible service resolution: pass
  after focused fix. Direct absolute-url services with `strategy: "direct"`
  now preserve the resolved target auth semantics and do not fall back to
  service/global configured Authorization headers when normal direct proxy
  access would skip managed auth.
- [x] Docs distinguish Refresh Metadata from Regenerate SDK: pass.

## Verification

Run or inspect:

- `git show --stat --oneline --no-renames 464ae4c1764bc8cd1272b5753b5f985880dbfa46` - reviewed.
- `git show --no-ext-diff --unified=120 --no-renames 464ae4c1764bc8cd1272b5753b5f985880dbfa46 -- packages/proxy/src/api/generate.ts packages/proxy/src/utils/metadata-refresh.ts packages/proxy/test/explorer-policy.test.ts` - reviewed.
- `Get-Content`/line-number inspection of `packages/proxy/src/api/generate.ts`,
  `packages/proxy/src/utils/explorer-policy.ts`,
  `packages/proxy/src/utils/metadata-refresh.ts`,
  `packages/proxy/src/utils/target.ts`,
  `packages/proxy/src/api/odata.ts`,
  `packages/proxy/src/plugins/btp-auth.ts`,
  `packages/proxy/src/utils/btp-destination.ts`,
  `packages/proxy/src/api/schema.ts`,
  `packages/nuxt/src/generate.ts`,
  `packages/nuxt/src/runtime/server-middleware.ts`, and
  `packages/explorer/composables/useODataState.ts` - reviewed.
- `pnpm.cmd exec vitest run packages/proxy/test/explorer-policy.test.ts` -
  pass outside sandbox; 1 file, 11 tests. Initial sandboxed run failed because
  `vitest` could not be resolved.
- `pnpm.cmd exec vitest run packages/nuxt/test/generate.test.ts` - pass
  outside sandbox; 1 file, 12 tests. Initial sandboxed run failed because
  `vitest` could not be resolved.
- `pnpm.cmd exec vitest run packages/proxy/test` - pass outside sandbox; 11
  files, 152 passed, 1 skipped.
- `pnpm.cmd --filter @bc8-odx/proxy run verify` - pass outside sandbox; proxy
  tests and standalone example passed. Initial sandboxed run failed with
  Windows `spawn EPERM` while loading Vitest config through esbuild.
- `pnpm.cmd --filter @bc8-odx/nuxt run playground:check` - pass outside
  sandbox; minimal playground verified. Initial sandboxed run failed with
  `EPERM` while unlinking generated `.nuxt/imports.d.ts`.
- `pnpm.cmd run lint` - pass.
- `pnpm.cmd run typecheck` - pass.
- `git diff --check` - pass.
- Focused re-review of Integrator commit
  `ea55184855ea656bacb738819a430e2b9813d252` - reviewed.
- `pnpm.cmd exec vitest run packages/proxy/test/explorer-policy.test.ts` -
  pass outside sandbox; 1 file, 12 tests. Initial sandboxed run could not
  resolve `vitest`.
- `git diff --check` - pass.

## Residual Risk

- No live SAP BTP Destination, Connectivity, XSUAA, or customer backend smoke
  test was performed.
- On-premise Connectivity handling remains only indirectly reviewed here. The
  current refresh path reuses `resolveProxyTarget`, but the broader proxy target
  path does not visibly consume the returned connectivity proxy details.
- The Explorer UI still uses the existing `generateService` action name; task
  080 intentionally kept UI redesign out of scope.

## Open Questions

- None.

## Test Gaps

- The direct-strategy auth regression test described in the original finding
  has been added and passes.
- Consider a focused production destination/auth/header test with a mocked BTP
  destination response, including stale fallback when destination resolution
  fails.

## Summary

Task 080 correctly separates production metadata refresh from SDK generation in
the main path. Production updates EDMX cache files and returns metadata refresh
status without invoking the Nuxt generator or writing generated TypeScript SDK
files. Development still invokes the injected generator when present, and
non-production hosts without a generator still return `501`. No db0, evlog,
Explorer UI redesign, or normal OData data proxy implementation changes were
introduced by the reviewed commit.

The task is approved after the focused Integrator fix. Production metadata
refresh remains separated from SDK generation: production responses use
`operation: "metadata-refresh"`, do not invoke the injected Nuxt generator, and
do not write generated TypeScript SDK files.

## Next Action

- `.agents/NEXT.md` was updated to request task 081 implementation next.
- Continue the remaining production runtime sequence with task 081, task 082,
  task 083, then task 085.

## Integrator Update

Status: ready for focused re-review.

- Finding addressed: `packages/proxy/src/utils/metadata-refresh.ts` now uses
  the resolved target auth semantics and skips service/global configured
  Authorization fallback when `target.strategy === "direct"` and the resolver
  did not provide an auth header.
- Regression test added:
  `packages/proxy/test/explorer-policy.test.ts` verifies production metadata
  refresh for a direct absolute-url service with global and service auth
  configured does not send an Authorization header to the backend.
- Verification passed:
  - `pnpm.cmd exec vitest run packages/proxy/test/explorer-policy.test.ts`
  - `pnpm.cmd exec vitest run packages/proxy/test`
  - `pnpm.cmd --filter @bc8-odx/proxy run verify`
  - `git diff --check`

## Focused Re-review

Status: approved.

- Direct-service auth semantics: pass. The refresh path now uses
  `target.authHeader || (target.strategy === 'direct' ? undefined :
  resolveConfiguredAuthHeader(service, config))`, so direct absolute-url
  services do not receive service/global configured Authorization fallback when
  the shared target resolver skipped managed auth.
- Regression coverage: pass. The new production test configures both global and
  service auth for a direct absolute-url service and asserts the backend
  `$metadata` request has no `authorization` header.
- SDK-generation separation: pass. The existing production test still asserts
  `operation: "metadata-refresh"`, `generated: false`, no generator call, and
  no `.nuxt/odx/generated` directory.
- Verification passed:
  - `pnpm.cmd exec vitest run packages/proxy/test/explorer-policy.test.ts`
  - `git diff --check`
