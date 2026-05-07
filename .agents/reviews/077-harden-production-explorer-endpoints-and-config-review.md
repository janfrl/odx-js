# Review: Harden production Explorer endpoints and config

Status: complete
Date: 2026-05-07
Reviewer: independent Reviewer workers
Task: `.agents/tasks/done/077-harden-production-explorer-endpoints-and-config.md`
Reviewed commits: `1b07b23`, `4625ca7`
Decision: approved after integration fix

## Findings

1. [P1] AppRouter sends Explorer client assets to proxy.
   The original `^/__odx__/(.*)$` catch-all forwarded every `/__odx__/*`
   request to `odx-proxy-backend`, including Explorer client assets under
   `/__odx__/client/`. Because the Explorer app is built with
   `baseURL: '/__odx__/client/'`, this would make the deployed standalone
   Explorer fail to load.

   Integrator update: addressed in `4625ca7` by routing `/__odx__/client` and
   `/__odx__/client/*` to `odx-explorer-ui`, while narrowing the runtime API
   route to `/__odx__/{config,logs,schema,generate,types,me}` for
   `odx-proxy-backend`. AppRouter tests cover both route classes.

2. [P3] Production config docs contradict returned fields.
   The original docs said production `/__odx__/config` returns only sanitized
   service information and does not expose runtime paths, while the
   implementation returned top-level `basePath` and `mode`.

   Integrator update: accepted `basePath`, `mode`, and `services` as the
   intentional production top-level whitelist. Docs and tests now describe and
   verify that contract while preserving strict service-field redaction.

## Acceptance Criteria

- [x] Production `/__odx__/config` returns a sanitized allowlist.
- [x] Sensitive service fields, global secrets, runtime paths, hooks,
  DevTools config, `forwardAuthHeader`, and `versions.node` are omitted.
- [x] Production `/__odx__` runtime APIs require SAP security context.
- [x] Development Explorer ergonomics are preserved.
- [x] AppRouter separates deployed Explorer client routes from runtime API
  routes.
- [x] Root documentation describes the internal endpoint contract.
- [x] Focused re-review approved the integration fix.

## Verification

Implementer verification:

- `pnpm.cmd exec vitest run packages/proxy/test`
- `pnpm.cmd --filter @bc8-odx/proxy run verify`
- `pnpm.cmd --filter @bc8-odx/explorer run verify`
- `pnpm.cmd --filter odx-approuter run verify`
- `pnpm.cmd run lint`
- `pnpm.cmd run typecheck`
- `git diff --check`

Integrator verification:

- `pnpm.cmd --filter odx-approuter run verify`
- `pnpm.cmd exec vitest run packages/proxy/test/explorer-policy.test.ts`
- `pnpm.cmd --filter @bc8-odx/explorer run verify`
- `pnpm.cmd run lint`
- `pnpm.cmd run typecheck`
- `git diff --check`

Focused re-review:

- `pnpm.cmd --filter odx-approuter run verify` - pass, 3 tests.
- `pnpm.cmd exec vitest run packages/proxy/test/explorer-policy.test.ts` -
  pass, 7 tests.

## Residual Risk

- No live SAP AppRouter/BTP smoke test was performed; route behavior was
  verified by config inspection and the AppRouter route-resolution test.
- Production traffic history is intentionally disabled until the later
  persistent log/redaction tasks define storage and retention policy.

## Open Questions

- Which BTP SQL backing service should become the first documented db0
  production connector target?

## Test Gaps

- None blocking for task 077 after focused re-review.

## Summary

The integration fix addresses the blocking AppRouter route issue and aligns the
production config whitelist contract across code, tests, and docs. Focused
re-review found no remaining issues.

## Next Action

- Document development versus production Explorer runtime differences before
  continuing into log storage and db0 work.
