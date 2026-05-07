# Task: Add db0-backed Explorer log store

Status: ready
Owner: unassigned
Created: 2026-05-07
Risk: high
Review: required

## Objective

Add a db0-backed implementation of the ODX traffic log store for deployed
Explorer usage, without leaking db0-specific APIs into Explorer or public ODX
contracts.

## Context

The operator prefers db0 as the provider-agnostic database path. db0 is
early-stage, so it must stay behind the ODX log store interface introduced by
task 078. BTP production should use a bound SQL database; SQLite is acceptable
only for local development or explicit single-instance demos.

Relevant files:

- `.agents/decisions/001-production-explorer-runtime-apis.md`
- `.agents/tasks/ready/078-introduce-odx-log-store-and-redaction.md`
- `package.json`
- `pnpm-lock.yaml`
- `packages/core/src/types.ts`
- `packages/proxy/package.json`
- `packages/proxy/src/api/logs.ts`
- `packages/proxy/src/utils/trace.ts`
- `packages/nuxt/src/config.ts`
- `DEPLOYMENT.md`
- `SECURITY.md`

## Scope

- Add db0 only where the persistent log store implementation needs it.
- Configure log storage through ODX runtime configuration and environment
  variables.
- Keep memory storage as the default for local development and tests unless
  persistent storage is explicitly configured.
- Add schema/table initialization or migration behavior appropriate for db0.
- Implement list/filter/detail/clear operations needed by Explorer.
- Document BTP production expectations, including that local SQLite is not
  multi-instance safe.
- Add focused tests with a deterministic db0 test connector or a narrow mocked
  db0 adapter boundary.

## Non-Goals

- Do not add evlog in this task.
- Do not store unredacted payloads.
- Do not introduce database access directly in Explorer components.
- Do not implement metadata caching in the log store tables.
- Do not require a specific BTP SQL provider unless the repository already has
  one configured.

## Acceptance Criteria

- [ ] Persistent log storage can be enabled through configuration.
- [ ] Memory storage remains available and tested.
- [ ] db0 implementation is isolated behind the ODX log store interface.
- [ ] Explorer log list and clear flows work against the persistent store.
- [ ] Production docs explain BTP database binding expectations and SQLite
  limitations.

## Verification

Task-local checks:

- `pnpm.cmd exec vitest run packages/proxy/test`
- `pnpm.cmd --filter @bc8-odx/proxy run verify`
- `pnpm.cmd --filter @bc8-odx/explorer run verify`
- `pnpm.cmd run lint`
- `pnpm.cmd run typecheck`

Dependency checks:

- Confirm `pnpm-lock.yaml` changes match the added db0 dependency only.

If a check is skipped, record why and the residual risk in Handoff Notes.

## Risk Notes

High risk because this adds persistence, database initialization, dependency
surface, and production deployment implications. Secure Teamflow is required.
Separate review is required.

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
