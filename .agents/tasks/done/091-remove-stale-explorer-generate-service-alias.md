# Task: Remove stale Explorer generateService alias

Status: done
Owner: Codex
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

- [x] `generateService` no longer appears in Explorer source or tests except in
      historical `.agents` notes.
- [x] Explorer components and tests use `refreshServiceMetadata`.
- [x] Existing metadata refresh behavior and endpoint URLs are unchanged.
- [x] Explorer package verification passes.

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

- changed files: `packages/explorer/composables/useODataState.ts`,
  `packages/explorer/test/state.test.ts`, `.agents/NEXT.md`, and this task
  file.
- summary: Removed the internal `generateService` compatibility alias from the
  Explorer shared state interface and return object. Updated the remaining
  Explorer state test to call `refreshServiceMetadata` while preserving the
  `/__odx__/generate` endpoint URL and existing metadata refresh behavior.
- tests run:
  - `pnpm.cmd --filter @bc8-odx/explorer run verify` - passed outside the
    sandbox; the first sandboxed run failed with Windows `spawn EPERM` while
    loading Vitest/esbuild.
  - `git grep -n "generateService" -- packages/explorer` - no matches, exit
    code 1 as expected for the successful no-match result.
  - `pnpm.cmd run lint`
  - `pnpm.cmd run typecheck`
  - `git diff --check`
- skipped checks and residual risk: No requested check was skipped. The
  generated `packages/explorer/.nuxtrc` test artifact was removed and is not
  part of this task.
- self-check result: Scope stayed on Explorer internal naming and focused
  tests. The proxy `/__odx__/generate` endpoint path, SDK generation behavior,
  Explorer UI design, and runtime metadata refresh response semantics were not
  changed.
- review requirement decision: Separate review is not required because task 091
  stayed within its low-risk internal naming cleanup scope and all requested
  verification passed.
- task state movement: Moved from `.agents/tasks/ready/` to
  `.agents/tasks/in-progress/` when starting, then to `.agents/tasks/done/`
  after implementation and verification.
- `.agents/NEXT.md` update: Updated to request a Planner chat because no ready
  task remains after task 091.
- commit hash: Pending until the final commit is created; recorded in the final
  implementer summary.
- known gaps: None.
