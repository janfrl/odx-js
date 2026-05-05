# Task: Protect DevTools log storage from external mutation

Status: ready
Owner: unassigned
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

- [ ] A focused test fails before implementation when mutating the returned log
  array.
- [ ] Subsequent `getODataLogs()` calls are unaffected by caller mutation of a
  previously returned array.
- [ ] Existing log append, clear, ordering, and retention behavior remains
  unchanged.
- [ ] No log entry payload shape or Explorer behavior changes are included.

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

