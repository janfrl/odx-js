# Task: Protect DevTools log storage from external mutation

Status: done
Owner: Codex
Created: 2026-05-05
Risk: low
Review: conditional - required if public log API mutability is intentionally changed or documented as mutable

## Objective

Prevent callers from mutating DevTools log storage by modifying arrays returned
from `getODataLogs()`.

## Context

DevTools logs are used by local diagnostics and Explorer state. If
`getODataLogs()` returns the internal storage array directly, external callers
can mutate stored log history and affect later reads. The log read API should
return a defensive array copy unless the project intentionally treats it as a
mutable public API.

Relevant docs and files:

- `AGENTS.md`
- `README.md`
- `CONTRIBUTING.md`
- `.agents/WORKFLOW.md`
- `packages/core/src/dev-logs.ts`
- `packages/proxy/test/dev-logs.test.ts`
- core package tests, if DevTools log tests live there instead

## Scope

- Add a failing test first that mutates the array returned by `getODataLogs()`
  and then expects a subsequent `getODataLogs()` read to remain unchanged.
- Return a defensive array copy from the log read path or otherwise protect
  internal log storage from returned-array mutation.
- Preserve log entry contents, ordering, retention behavior, clearing behavior,
  and existing DevTools logging tests.
- Keep the change focused on returned-array mutation protection.

## Non-Goals

- Do not deep-freeze log entries, redesign DevTools logging, alter log payload
  shape, change retention limits, change Explorer UI, change proxy trace
  behavior, add dependencies, modify package scripts, lockfiles, or generated
  files.
- Do not change public documentation unless the implementation reveals a
  documented mutability contract conflict.

## Acceptance Criteria

- [x] A focused test fails before implementation when mutating the returned log
  array.
- [x] Subsequent `getODataLogs()` calls are unaffected by caller mutation of a
  previously returned array.
- [x] Existing log append, clear, ordering, and retention behavior remains
  unchanged.
- [x] No log entry payload shape or Explorer behavior changes are included.

## Verification

Task-local checks:

- `pnpm.cmd exec vitest run packages/proxy/test/dev-logs.test.ts`
- `pnpm.cmd --filter @bc8-odx/proxy run verify`
- `pnpm.cmd --filter @bc8-odx/core run verify`
- `pnpm.cmd run lint`

Checkpoint or broad checks, if required:

- `pnpm.cmd run typecheck`

Setup/data prerequisites:

- Use existing DevTools log tests and local fixtures only.
- If the relevant test file is in the core package rather than proxy, run the
  package-local focused test command that covers `packages/core/src/dev-logs.ts`
  and record the exact command in Handoff Notes.
- Use `pnpm.cmd`, not `pnpm`, on this Windows machine because PowerShell blocks
  `.ps1` launchers.

If a check is skipped, record why and the residual risk in Handoff Notes.

## Risk Notes

Low risk if the change only prevents mutation of the returned array while
preserving log entries and existing behavior. Separate review is not required
unless the public log API is treated as intentionally mutable, log payload
shape changes, retention semantics change, or Explorer/proxy behavior is
broadened.

## Handoff Notes

- changed files: `packages/core/src/dev-logs.ts`, `packages/proxy/test/dev-logs.test.ts`, `.agents/tasks/done/066-protect-devtools-log-storage-from-external-mutation.md`, `.agents/NEXT.md`
- summary: added focused regression coverage for caller mutation of the array returned by `getODataLogs()` and changed `getODataLogs()` to return a shallow defensive copy of the internal log array. Log entry objects, ordering, retention, and clearing behavior were preserved.
- failing-first proof: before implementation, `pnpm.cmd exec vitest run packages/proxy/test/dev-logs.test.ts` failed in `protects stored logs from returned array mutation` with `AssertionError: expected [ ...(2) ] to have a length of 1 but got 2` at `packages/proxy/test/dev-logs.test.ts:41`.
- tests run:
  - `pnpm.cmd exec vitest run packages/proxy/test/dev-logs.test.ts` (failed before implementation as expected)
  - `pnpm.cmd exec vitest run packages/proxy/test/dev-logs.test.ts` (passed: 1 file, 3 tests)
  - `pnpm.cmd --filter @bc8-odx/proxy run verify` (passed: 9 files, 105 tests passed, 1 skipped, standalone proxy example passed)
  - `pnpm.cmd --filter @bc8-odx/core run verify` (passed: 5 files, 28 tests, standalone core example passed)
  - `pnpm.cmd run typecheck` (passed)
  - `pnpm.cmd run lint` (passed)
  - `git diff --check` (passed; Git warned that touched LF files will be replaced by CRLF when Git touches them)
- skipped checks and residual risk: no required checks were skipped.
- self-check result: scope, acceptance criteria, relevant docs, architecture boundaries, security/privacy implications, and unrelated changes checked. Change is limited to returned-array mutation protection and focused tests.
- review requirement decision: separate review is not required by `.agents/WORKFLOW.md` because this is low-risk internal storage protection, does not document a mutable public contract, and does not change log payload shape, retention semantics, Explorer behavior, or proxy trace behavior.
- task state movement: moved from `.agents/tasks/ready/` to `.agents/tasks/in-progress/` on start, then to `.agents/tasks/done/` after verification.
- `.agents/NEXT.md` update: ready queue is empty except `.gitkeep`; updated to the Planner prompt for creating next tasks.
- commit hash: commit containing this handoff.
- known gaps: none.
