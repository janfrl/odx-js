# Review: Tighten production Explorer deployment consistency checks

Status: complete
Date: 2026-05-08
Reviewer: Codex
Task: `.agents/tasks/done/090-tighten-production-explorer-deployment-consistency-checks.md`
Reviewed commit: `56f46c1e9c0cca012c682ab163d7ef4f474bb7f1`
Decision: approved

## Findings

None.

## Acceptance Criteria

- [x] `pnpm.cmd --filter odx-approuter run verify` verifies the MTA
      provider/consumer relationship for `odx-proxy-backend` and
      `odx-explorer-ui`: pass. The AppRouter destination requirements are
      checked against the `odx-proxy` and `odx-explorer` module `provides`
      entries in `packages/approuter/test/deployment-config.test.ts:264`.
- [x] The verification proves both AppRouter destinations forward auth tokens:
      pass. The expected proxy and Explorer destination requirements assert
      `forwardAuthToken: true`.
- [x] The verification proves the proxy and Explorer modules have the required
      service bindings for the documented production runtime: pass. The test
      asserts the managed XSUAA, Destination, and Connectivity resources and
      the required `odx-proxy` and `odx-explorer` module bindings in
      `packages/approuter/test/deployment-config.test.ts:304`.
- [x] The verification rejects broad `/__odx__/*` catch-all routes and
      unsupported runtime endpoint routes: pass. Unsupported `/__odx__` paths
      are asserted to remain unresolved in
      `packages/approuter/test/deployment-config.test.ts:385`.
- [x] Existing route-resolution tests for client assets and runtime APIs remain
      intact: pass. Client and runtime API routing checks remain covered at
      `packages/approuter/test/deployment-config.test.ts:321` and
      `packages/approuter/test/deployment-config.test.ts:355`.

## Verification

Run or inspect:

- `git show --stat --oneline --no-renames 56f46c1e9c0cca012c682ab163d7ef4f474bb7f1`
  - pass; the commit is scoped to AppRouter deployment tests and `.agents`
  workflow/task state.
- `git show --no-ext-diff --unified=80 --no-renames 56f46c1e9c0cca012c682ab163d7ef4f474bb7f1 -- packages/approuter/test/deployment-config.test.ts`
  - pass; reviewed the added deterministic MTA parsing, destination
  forwarding, service-binding, route-ordering, and unsupported-path checks.
- `mta.yaml` - inspected; no configuration changes were made by task 090, and
  the current provider, destination, token-forwarding, and service-binding
  contract is what the tests assert.
- `packages/approuter/xs-app.json` - inspected; no route changes were made by
  task 090, and the route split still sends Explorer client paths to
  `odx-explorer-ui` and only supported `/__odx__` runtime APIs to
  `odx-proxy-backend`.
- `packages/approuter/package.json` - inspected; no package metadata,
  dependency, or script changes were made.
- `pnpm.cmd --filter odx-approuter run verify` - pass outside sandbox, 1 file,
  6 tests. The first sandboxed run failed with Windows `spawn EPERM` while
  Vitest/esbuild loaded config.
- `pnpm.cmd run lint` - pass.
- `pnpm.cmd run typecheck` - pass.
- `git diff --check` - pass.

## Residual Risk

- No live SAP BTP, Cloud Foundry, or real SAP AppRouter smoke test was
  performed. This is acceptable for task 090 because its stated scope was
  deterministic local config parsing and route-resolution verification.

## Open Questions

- None.

## Test Gaps

- None blocking. A future live deployment smoke test would still provide
  additional confidence when a BTP environment is available.

## Summary

Task 090 is approved. The implementation did not deploy to Cloud Foundry,
start a real AppRouter, change runtime endpoint behavior, edit MTA/AppRouter
configuration, change package metadata or dependencies, or update user-facing
deployment docs. The added AppRouter package tests cover the requested
deployment consistency contract.

## Next Action

- `.agents/NEXT.md` was updated to start task 091 implementation.
- Follow-up task or fix required: none for task 090.
