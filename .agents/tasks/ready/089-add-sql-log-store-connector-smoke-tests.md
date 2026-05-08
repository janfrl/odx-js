# Task: Add SQL log-store connector smoke tests

Status: ready
Owner: unassigned
Created: 2026-05-08
Risk: medium
Review: conditional - required if runtime code, dependency metadata, or deployment docs change; not required for test-only smoke coverage

## Objective

Make the proxy verification suite fail when a documented SQL log-store connector
cannot be loaded with the package's declared runtime dependencies.

## Context

Task 079 added db0-backed SQL log storage. Its review found that the documented
PostgreSQL production path could not start until `pg` was added as a direct
proxy runtime dependency. The fix was verified manually with an import command,
but the package tests still use a fake db0 adapter and do not permanently cover
connector importability.

Relevant files:

- `.agents/reviews/079-add-db0-backed-explorer-log-store-review.md`
- `packages/proxy/package.json`
- `packages/proxy/src/utils/log-store.ts`
- `packages/proxy/test/db0-log-store.test.ts`

## Scope

Include:

- Add a focused proxy test that imports the documented db0 PostgreSQL connector
  from the proxy package context.
- Add equivalent smoke coverage for the configured SQLite connector if it is
  useful and deterministic.
- Keep the test from opening a real PostgreSQL or SQLite database connection.
- Keep db0-specific details behind the existing proxy log-store boundary.
- Avoid adding new dependencies unless the smoke test exposes a real missing
  runtime dependency.

## Non-Goals

- Do not require a live database or SAP BTP binding.
- Do not change production log payload policy.
- Do not add migrations beyond the existing db0 table initialization behavior.
- Do not expose db0 APIs to Explorer or public ODX contracts.

## Acceptance Criteria

- [ ] Proxy tests fail if `db0/connectors/postgresql` cannot be imported with
      the package's installed runtime dependencies.
- [ ] The smoke test does not attempt a real network database connection.
- [ ] Existing fake db0 store behavior tests remain intact.
- [ ] No new dependency is added unless the test proves it is required.

## Verification

Task-local checks:

- `pnpm.cmd exec vitest run packages/proxy/test/db0-log-store.test.ts`
- `pnpm.cmd --filter @bc8-odx/proxy run verify`
- `pnpm.cmd run lint`
- `pnpm.cmd run typecheck`
- `git diff --check`

Checkpoint or broad checks, if required:

- none

Setup/data prerequisites:

- none

If a check is skipped, record why and the residual risk in Handoff Notes.

## Risk Notes

Medium risk because this guards deployment/runtime dependency correctness for
production SQL log storage. Separate review is optional for a test-only change
that does not alter runtime code or package metadata. If the task changes
runtime dependencies, production config, or deployment docs, separate review is
required.

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
