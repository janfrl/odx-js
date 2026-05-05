# Task: Expand Explorer tests carefully

Status: done
Owner: Codex orchestrator
Created: 2026-05-05
Risk: medium
Review: conditional - required if UI behavior or visual structure changes

## Objective

Add focused Explorer tests that increase confidence without changing the UI.

## Context

The Explorer is already in a good state. The operator wants test value but is
concerned that AI-driven UI changes may break the experience. This task is
test-first and should avoid visual or interaction redesign.

Relevant files:

- `packages/explorer/test/state.test.ts`
- `packages/explorer/components/tabs/TabLogs.vue`
- `packages/explorer/components/tabs/TabProxy.vue`
- `packages/explorer/composables/useODataState.ts`
- `packages/explorer/composables/useEntityExplorer.ts`
- `packages/explorer/composables/useSchemaExplorer.ts`

## Scope

- Add tests for existing Explorer state/composable behavior.
- Prefer traffic-log and proxy-trace state because those are valuable and
  less likely to require visual changes.
- Do not modify component layout unless a test exposes a real bug.
- If browser verification is needed, use port `3000` and do it late in the
  workflow.

## Non-Goals

- Do not redesign Explorer UI.
- Do not change spacing, colors, layout, or visual hierarchy.
- Do not add browser automation early in the task.
- Do not introduce flaky visual snapshot tests.

## Acceptance Criteria

- [x] New tests cover existing Explorer behavior.
- [x] No UI files are changed unless a bug is verified by a failing test.
- [x] Existing Explorer tests still pass.
- [x] If browser mode is used, it uses port `3000` and happens after code/test
      work is complete.

## Verification

Task-local checks:

- `pnpm.cmd run test -- packages/explorer`
- `pnpm.cmd run typecheck`

Checkpoint or broad checks, if required:

- `pnpm.cmd run lint`
- Browser verification on port `3000` only if UI behavior changes.

Setup/data prerequisites:

- Use `pnpm.cmd`, not `pnpm`, on this Windows machine because PowerShell blocks
  `.ps1` launchers.

If a check is skipped, record why and the residual risk in Handoff Notes.

## Risk Notes

Medium risk because Explorer UI is user-facing. Separate review is required if
the task changes UI behavior or visual structure; not required for test-only
coverage.

## Handoff Notes

- Changed files:
  - `packages/explorer/test/state.test.ts`
- Summary:
  - Added state/composable tests for clearing traffic logs, coordinating proxy
    trace selection state, and preserving degraded service health until a forced
    online update.
  - Expanded test setup resets for shared state fields that can leak between
    composable tests.
  - No Explorer UI, layout, styling, or component files changed.
- Tests run:
  - `pnpm.cmd exec vitest run packages\explorer\test\state.test.ts` passed.
  - `pnpm.cmd run lint` passed.
  - `pnpm.cmd run typecheck` passed.
- Skipped checks and residual risk:
  - Browser verification was not run because this task changed tests only and no
    UI behavior or visual structure changed.
- Self-check result:
  - Scope remained test-only and focused on existing state behavior.
- Review requirement decision:
  - Separate review not required by `.agents/WORKFLOW.md` because UI behavior
    and visual structure did not change.
- Task state movement:
  - Move to `.agents/tasks/done/`.
- `.agents/NEXT.md` update:
  - Advance to package isolation implementation.
- Commit hash:
  - To be filled after commit.
- Known gaps:
  - Component-level Explorer tests are still sparse; future work should remain
    test-first and avoid visual churn.
