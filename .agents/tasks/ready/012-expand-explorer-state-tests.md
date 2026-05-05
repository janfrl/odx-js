# Task: Expand Explorer state tests

Status: ready
Owner: unassigned
Created: 2026-05-05
Risk: medium
Review: conditional - required if UI behavior changes

## Objective

Increase Explorer confidence through state/composable tests before any UI work.

## Context

Explorer is already in a good state. Package confidence should improve through
tests first, with no visual churn unless a failing test proves a bug.

Relevant files:

- `.agents/PACKAGE_ISOLATION.md`
- `packages/explorer/test/state.test.ts`
- `packages/explorer/composables/**`
- `packages/explorer/components/tabs/TabLogs.vue`
- `packages/explorer/components/tabs/TabProxy.vue`

## Scope

- Add tests for traffic-log state, proxy-trace selection, and entity/query state
  transitions.
- Avoid component layout/style changes.
- Use browser verification on port `3000` only if UI behavior changes.

## Non-Goals

- Do not redesign Explorer UI.
- Do not add flaky visual snapshots.
- Do not start browser verification unless UI behavior changes.

## Acceptance Criteria

- [ ] Explorer state/composable coverage increases.
- [ ] No UI files change unless a test proves a bug.
- [ ] Existing Explorer tests pass.

## Verification

Task-local checks:

- `pnpm.cmd run test -- packages/explorer`
- `pnpm.cmd run typecheck`

## Risk Notes

Medium risk because Explorer is user-facing. Separate review is required only if
UI behavior or visual structure changes.

## Handoff Notes

To be completed by the implementer.
