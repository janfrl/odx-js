# Review: Cover BTP destination metadata refresh

Status: complete
Date: 2026-05-08
Reviewer: Codex
Task: `.agents/tasks/done/088-cover-btp-destination-metadata-refresh.md`
Reviewed commit: `4b28a6e9dabc6356a15c544f8663ec948eb3a5c5`
Decision: approved after focused re-review

## Findings

Focused re-review findings after Integrator commit
`cedea922665202f6156f0295420f25c044728223`: none.

Original finding, now resolved:

1. [P1] Strict production metadata refresh can still fall back to the local SAP
   mock target when BTP bindings are missing:
   `packages/proxy/src/utils/btp-destination.ts:152`. The task's runtime fix
   passes `allowBtpDestinationFallback: false` from
   `packages/proxy/src/utils/metadata-refresh.ts:331`, but that only prevents
   the catch fallback in `resolveProxyTarget`. `resolveBtpDestination` returns a
   mock `/sap/opu/odata/sap` destination with mock credentials before throwing
   when Destination or XSUAA bindings are absent, even under
   `NODE_ENV=production`. For a destination-backed service with stale cache and
   missing or misbound BTP services, `/__odx__/generate` can still make a local
   `$metadata` request and record a local 404 or `[metadata-path]` stale reason
   instead of a BTP binding/resolution failure. That reintroduces the pre-fix
   failure mode for an important production misconfiguration class and gives
   operators the wrong failure cause. Fix by making strict metadata refresh
   treat missing Destination/XSUAA bindings as a BTP destination resolution
   failure without removing the intended local development fallback. Add a
   focused regression test for a production destination-backed refresh with no
   usable BTP binding, stale cache present, and an injected generator, asserting
   `operation: "metadata-refresh"`, `generated: false`, `source: "cache"`, no
   generator call, and a BTP binding/resolution stale reason rather than a local
   fallback 404/path.

## Acceptance Criteria

- [x] A production destination-backed metadata refresh test proves `$metadata`
      is fetched from the resolved destination target: pass.
- [x] The test proves destination-provided auth wins and service/global auth is
      not leaked into the metadata refresh request: pass for destination
      auth-token resolution.
- [x] A production stale-cache fallback test covers destination or metadata
      failure and confirms the response remains metadata refresh only: pass
      after focused fix. Metadata fetch failure, Destination Service HTTP
      failure, and missing production Destination/XSUAA bindings now reach
      stale-cache fallback with metadata-refresh-only responses.
- [x] Tests do not depend on live BTP services or external network access:
      pass.
- [x] Existing BTP destination and Explorer policy tests remain green: pass in
      the focused suite rerun during review.

## Verification

Run or inspect:

- `git show --stat --oneline --no-renames 4b28a6e9dabc6356a15c544f8663ec948eb3a5c5` -
  reviewed.
- `git show --no-ext-diff --unified=160 --no-renames 4b28a6e9dabc6356a15c544f8663ec948eb3a5c5 -- packages/proxy/src/utils/metadata-refresh.ts packages/proxy/src/utils/target.ts packages/proxy/test/explorer-policy.test.ts` -
  reviewed.
- Line-number inspection of `packages/proxy/src/utils/metadata-refresh.ts`,
  `packages/proxy/src/utils/target.ts`,
  `packages/proxy/src/utils/btp-destination.ts`,
  `packages/proxy/src/api/generate.ts`,
  `packages/proxy/src/utils/headers.ts`,
  `packages/proxy/src/api/odata.ts`,
  `packages/proxy/src/plugins/btp-auth.ts`, and the focused tests - reviewed.
- `pnpm.cmd exec vitest run packages/proxy/test/explorer-policy.test.ts packages/proxy/test/btp-destination.test.ts` -
  pass outside sandbox; 2 files, 43 tests passed. Initial sandboxed run could
  not resolve `vitest`.
- `git diff --check 4b28a6e9dabc6356a15c544f8663ec948eb3a5c5^ 4b28a6e9dabc6356a15c544f8663ec948eb3a5c5` -
  pass.

## Residual Risk

- No live SAP BTP Destination, Connectivity, XSUAA tenant, or customer backend
  smoke test was performed; this is acceptable for task 088 because the task
  explicitly requires deterministic local coverage.
- Full proxy verify, lint, and typecheck were not rerun during focused
  re-review; the Integrator recorded them as passing. The focused Explorer/BTP
  suites passed independently during focused re-review.

## Open Questions

- None.

## Test Gaps

- The missing Destination/XSUAA binding coverage requested by the original
  finding was added and passed.

## Summary

The implementation adds useful deterministic fixture coverage for successful
BTP Destination metadata refresh, destination-auth precedence, useful metadata
headers, restricted proxy headers, metadata-fetch stale fallback, and
Destination Service HTTP failure fallback. The runtime change is narrowly
scoped to metadata refresh by passing `allowBtpDestinationFallback: false` into
the shared target resolver, and normal proxy resolver defaults remain
unchanged.

The task is approved after the focused Integrator fix. Strict production
runtime metadata refresh now surfaces missing Destination/XSUAA bindings as a
BTP destination resolution failure before any local `/sap/opu/odata/sap`
fallback can be used, while normal proxy resolver defaults and local
development fallback behavior remain preserved.

## Original Next Action

- `.agents/NEXT.md` was updated to request a focused Integrator fix for task
  088 using this review note.
- Follow-up task or fix required at that point: fix the missing-binding strict
  metadata refresh fallback and add a deterministic regression test.

## Integrator Update

Status: ready for focused re-review.

- Finding addressed: strict production runtime metadata refresh now passes the
  existing no-fallback intent through `resolveProxyTarget` into
  `resolveBtpDestination`, so missing Destination/XSUAA bindings throw a BTP
  destination resolution error instead of returning the local
  `/sap/opu/odata/sap` mock target.
- Scope preserved: the BTP helper option defaults to preserving the existing
  missing-binding fallback for normal proxy resolver calls and local
  development behavior.
- Regression coverage added:
  `packages/proxy/test/explorer-policy.test.ts` now covers production
  `/__odx__/generate?service=DestinationService088` with stale cache, an
  injected generator, and no usable BTP bindings. It asserts
  `operation: "metadata-refresh"`, `generated: false`, `source: "cache"`, no
  generator call, and a BTP binding/resolution stale reason without local 404
  or `[metadata-path]` fallback text.
- Helper coverage added:
  `packages/proxy/test/btp-destination.test.ts` covers the strict
  missing-binding option without external service calls.
- Verification passed:
  - `pnpm.cmd exec vitest run packages/proxy/test/explorer-policy.test.ts packages/proxy/test/btp-destination.test.ts`
  - `pnpm.cmd --filter @bc8-odx/proxy run verify`
  - `pnpm.cmd run lint`
  - `pnpm.cmd run typecheck`
  - `git diff --check`

## Focused Re-review

Status: approved.

- Findings: none.
- Strict production missing-binding behavior: pass. Runtime metadata refresh
  calls `resolveProxyTarget` with `allowBtpDestinationFallback: false`, the
  target resolver passes that no-fallback intent to `resolveBtpDestination`,
  and the BTP helper throws in production when Destination/XSUAA bindings are
  missing instead of returning the local mock target.
- Fallback preservation: pass. The new helper option defaults to preserving the
  existing missing-binding fallback, and `resolveProxyTarget` still enables it
  for normal resolver calls. Non-production BTP fallback behavior remains
  unchanged.
- Regression coverage: pass.
  `packages/proxy/test/explorer-policy.test.ts` now covers production
  `/__odx__/generate?service=DestinationService088` with stale cache, no usable
  BTP bindings, and an injected generator. It asserts `operation:
  "metadata-refresh"`, `generated: false`, `source: "cache"`, no generator
  call, and a BTP binding/resolution stale reason without local 404 or
  `[metadata-path]` text.
- Helper coverage: pass. `packages/proxy/test/btp-destination.test.ts` covers
  strict missing-binding behavior without making external service calls.
- Scope: pass. The focused fix stays out of Explorer UI, unrelated direct
  service behavior, dependencies, lockfiles, generated files, and unrelated
  docs.
- Verification rerun:
  - `pnpm.cmd exec vitest run packages/proxy/test/explorer-policy.test.ts packages/proxy/test/btp-destination.test.ts`
    first failed in the sandbox because `vitest` could not be resolved.
  - The same command passed outside the sandbox: 2 files, 45 tests.

## Final Next Action

- `.agents/NEXT.md` was updated to request implementation of task 089 next:
  `.agents/tasks/ready/089-add-sql-log-store-connector-smoke-tests.md`.
