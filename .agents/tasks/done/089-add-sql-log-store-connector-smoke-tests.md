# Task: Add SQL log-store connector smoke tests

Status: done
Owner: Codex
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

- [x] Proxy tests fail if `db0/connectors/postgresql` cannot be imported with
      the package's installed runtime dependencies.
- [x] The smoke test does not attempt a real network database connection.
- [x] Existing fake db0 store behavior tests remain intact.
- [x] No new dependency is added unless the test proves it is required.

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

- Changed files:
  - `packages/proxy/test/db0-log-store.test.ts`
  - `.agents/tasks/done/089-add-sql-log-store-connector-smoke-tests.md`
  - `.agents/NEXT.md`
- Summary:
  - Added an import-only smoke test for the documented db0 PostgreSQL
    connector from the proxy package test context.
  - Added the same deterministic import smoke coverage for the configured
    `db0/connectors/node-sqlite` connector.
  - The smoke test asserts the default exports are connector factories but does
    not invoke them, so it does not open a PostgreSQL, SQLite, or network
    database connection.
  - No runtime code, dependency metadata, deployment docs, lockfiles, generated
    files, or public db0 APIs were changed.
- Tests run:
  - `pnpm.cmd exec vitest run packages/proxy/test/db0-log-store.test.ts` -
    pass outside sandbox, 1 file, 6 tests. Initial sandboxed run could not
    resolve `vitest`; direct runner invocation showed Windows sandbox
    `spawn EPERM`, so the exact command was rerun outside the sandbox.
  - `pnpm.cmd --filter @bc8-odx/proxy run verify` - pass outside sandbox, 11
    files, 170 passed, 1 skipped, plus proxy standalone example.
  - `pnpm.cmd run lint` - pass.
  - `pnpm.cmd run typecheck` - pass.
  - `git diff --check` - pass.
- Skipped checks and residual risk:
  - No checks skipped.
  - No live PostgreSQL, SQLite, SAP BTP binding, or customer database smoke
    test was run; the task explicitly required deterministic connector import
    coverage without opening a real connection.
- Self-check result:
  - Scope matches task 089. The change is test-only plus `.agents` workflow
    state, keeps db0 details inside existing proxy-owned test coverage, and
    does not expose db0 APIs outside the log-store boundary.
  - Existing fake db0 behavior tests remain in the same test file and passed.
  - No new dependency was added because the connector imports succeeded with
    the package's declared runtime dependencies.
- Review requirement decision:
  - Separate review is not required because the completed change is test-only
    plus `.agents` workflow state and does not change runtime code, dependency
    metadata, deployment docs, lockfiles, generated files, or public contracts.
- Task state movement:
  - Moved from `.agents/tasks/ready/` to `.agents/tasks/in-progress/` at
    start.
  - Moved to `.agents/tasks/done/` after implementation and verification.
- `.agents/NEXT.md` update:
  - Updated to start task 090 next and mark its separate review as required.
- Commit hash:
  - Pending final implementation commit; report the completed commit hash in
    the final response.
- Known gaps:
  - No live database initialization or query execution coverage was added by
    design.
