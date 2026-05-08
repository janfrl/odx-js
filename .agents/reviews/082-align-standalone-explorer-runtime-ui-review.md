# Review: Align standalone Explorer runtime UI

Status: complete
Date: 2026-05-08
Reviewer: Codex
Task: `.agents/tasks/done/082-align-standalone-explorer-runtime-ui.md`
Reviewed commit: `36136d8795a1bbf9e3038eb027e642c52ee770f5`
Decision: approved

## Findings

None.

## Acceptance Criteria

- [x] Production users see Refresh Metadata semantics, not SDK-generation
  promises: pass. Production-like stale metadata UI uses Refresh Metadata, and
  success/error toasts branch on the endpoint result instead of promising SDK
  generation.
- [x] Development users can still trigger SDK regeneration when supported:
  pass. The Regenerate SDK label remains gated behind service/config generation
  capability or local development version metadata.
- [x] Standalone Explorer can be configured for the correct API base: pass.
  Internal Explorer APIs and proxied runtime calls use the configured
  `odxApiBase` helper paths without changing proxy endpoint policy.
- [x] Stale/missing metadata states are represented without misleading success
  messages: pass. Stale metadata maps to degraded health, missing metadata maps
  to offline health, and displayed messages distinguish cached/stale/missing
  metadata from successful refresh.
- [x] Relevant state tests pass: pass.

## Verification

Run or inspect:

- `git show --stat --oneline 36136d8` - reviewed.
- `git show --no-ext-diff --unified=80 --no-renames 36136d8 -- ...` for the
  task file, Explorer config, state composables, touched components, and state
  tests - reviewed.
- `packages/explorer/nuxt.config.ts` - reviewed configurable public
  `odxApiBase`.
- `packages/explorer/composables/useODataState.ts` - reviewed API-base helpers,
  metadata refresh action, capability gating, stale/missing health mapping, and
  schema/log/config/generate/mockdata endpoint construction.
- `packages/explorer/composables/useEntityExplorer.ts` and
  `packages/explorer/components/DataEditor.vue` - reviewed runtime proxy URL
  usage for entity reads, writes, and deletes.
- `packages/explorer/components/entity/OfflineState.vue`,
  `packages/explorer/components/tabs/TabOverview.vue`,
  `packages/explorer/components/tabs/TabProxy.vue`, and
  `packages/explorer/components/tabs/TabServices.vue` - reviewed runtime
  metadata, generated type, SDK generation, identity, and layout messaging.
- `packages/explorer/test/state.test.ts` - reviewed focused coverage for
  configured API base, metadata refresh semantics, SDK generation capability
  gating, and stale/missing metadata health.
- `C:\tmp\odx-explorer-task082.png` - inspected. The 1440x1000 headless Chrome
  screenshot at `http://127.0.0.1:3401/__odx__/client/` shows production-like
  stale metadata with a Refresh Metadata action and no production SDK
  regeneration promise.
- `pnpm.cmd --filter @bc8-odx/explorer run verify` - pass outside sandbox; 1
  file, 40 tests. The first sandboxed run failed with Windows `spawn EPERM`
  while starting Vitest/esbuild.
- `pnpm.cmd run lint` - pass.
- `pnpm.cmd run typecheck` - pass.
- `git diff --check` - pass.

## Residual Risk

- No live SAP BTP/AppRouter deployment smoke test was performed; this matches
  the implementer handoff residual risk.
- The Browser verification used mocked runtime API responses, so deployed
  routing remains covered by inspection and unit tests rather than a live
  end-to-end environment.

## Open Questions

- None.

## Test Gaps

- None blocking. A later deployment smoke test would still be useful when a BTP
  environment is available.

## Summary

Task 082 stays within Explorer runtime UI/state scope. It does not introduce
proxy endpoint security changes, persistence dependencies, metadata cache
implementation changes, db0, evlog, or marketing/landing-page scope. The
configured `odxApiBase` is applied to internal Explorer APIs and runtime proxy
calls, production-like configs show Refresh Metadata semantics, and local SDK
regeneration wording remains gated to supported development capability.

## Next Action

- `.agents/NEXT.md` was updated to start task 083 implementation.
- Follow-up task or fix required: none for task 082.
