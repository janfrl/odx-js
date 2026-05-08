# Task: Remove stale Explorer generateService alias

Status: ready
Owner: unassigned
Created: 2026-05-08
Risk: low
Review: not required

## Objective

Remove the remaining internal `generateService` alias from Explorer state so
the code uses Refresh Metadata terminology consistently after the runtime
generation split.

## Context

Task 080 intentionally left the Explorer UI action name cleanup for later, and
task 082 moved UI components to `refreshServiceMetadata`. A compatibility alias
still remains in `useODataState.ts`, and one state test still calls
`generateService`. That alias now obscures the production distinction between
runtime metadata refresh and development SDK generation.

Relevant files:

- `.agents/reviews/080-separate-runtime-metadata-refresh-from-sdk-generation-review.md`
- `.agents/tasks/done/082-align-standalone-explorer-runtime-ui.md`
- `packages/explorer/composables/useODataState.ts`
- `packages/explorer/test/state.test.ts`

## Scope

Include:

- Remove `generateService` from the Explorer shared state interface and return
  object.
- Update remaining Explorer tests to call `refreshServiceMetadata`.
- Search Explorer source and tests to confirm the old alias is gone.
- Preserve the existing `/__odx__/generate` endpoint path; this task is only
  about Explorer internal naming.

## Non-Goals

- Do not rename the proxy `/__odx__/generate` endpoint.
- Do not change SDK generation behavior.
- Do not redesign Explorer UI.
- Do not change runtime metadata refresh response semantics.

## Acceptance Criteria

- [ ] `generateService` no longer appears in Explorer source or tests except in
      historical `.agents` notes.
- [ ] Explorer components and tests use `refreshServiceMetadata`.
- [ ] Existing metadata refresh behavior and endpoint URLs are unchanged.
- [ ] Explorer package verification passes.

## Verification

Task-local checks:

- `pnpm.cmd --filter @bc8-odx/explorer run verify`
- `git grep -n "generateService" -- packages/explorer`
- `pnpm.cmd run lint`
- `pnpm.cmd run typecheck`
- `git diff --check`

Checkpoint or broad checks, if required:

- none

Setup/data prerequisites:

- none

If a check is skipped, record why and the residual risk in Handoff Notes.

## Risk Notes

Low risk because this is a narrow Explorer internal naming cleanup with focused
tests and no runtime API contract change. Separate review is not required if
the task stays within the stated scope.

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
