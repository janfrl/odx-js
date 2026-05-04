# Task: Expand Explorer tests carefully

Status: ready
Owner: unassigned
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

- [ ] New tests cover existing Explorer behavior.
- [ ] No UI files are changed unless a bug is verified by a failing test.
- [ ] Existing Explorer tests still pass.
- [ ] If browser mode is used, it uses port `3000` and happens after code/test
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

To be completed by the implementer:

- changed files
- summary
- tests run
- skipped checks and residual risk
- self-check result
- review requirement decision
- task state movement
- `.agents/NEXT.md` update
- commit hash
- known gaps
