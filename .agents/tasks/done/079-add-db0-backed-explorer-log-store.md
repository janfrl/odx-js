# Task: Add db0-backed Explorer log store

Status: done
Owner: Codex
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

- [x] Persistent log storage can be enabled through configuration.
- [x] Memory storage remains available and tested.
- [x] db0 implementation is isolated behind the ODX log store interface.
- [x] Explorer log list and clear flows work against the persistent store.
- [x] Production docs explain BTP database binding expectations and SQLite
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

- changed files: `API.md`, `ARCHITECTURE.md`, `DEPLOYMENT.md`,
  `SECURITY.md`, `packages/core/src/types.ts`, `packages/nuxt/src/config.ts`,
  `packages/nuxt/src/module.ts`, `packages/proxy/package.json`,
  `packages/proxy/src/api/logs.ts`,
  `packages/proxy/src/utils/db0-log-store.ts`,
  `packages/proxy/src/utils/log-store.ts`,
  `packages/proxy/src/utils/trace.ts`,
  `packages/proxy/test/db0-log-store.test.ts`, `pnpm-lock.yaml`,
  `.agents/NEXT.md`, and this task file.
- summary: Added an internal proxy-owned db0 SQL implementation of the existing
  `OdxLogStore` boundary, with table initialization, append/update/list/get,
  bounded retention, and clear behavior. Added runtime/env configuration for
  `memory` versus `sql` log storage while keeping memory as the default.
  Production proxy tracing now stays disabled unless SQL storage is explicitly
  configured; when enabled, it stores redacted metadata and omits request and
  response payload bodies by default. Production `/__odx__/logs` lists and
  clears persisted logs only when SQL storage is configured, otherwise it keeps
  the prior empty-list/forbidden-clear policy.
- tests run:
  - `pnpm.cmd exec vitest run packages/proxy/test/db0-log-store.test.ts`
  - `pnpm.cmd exec vitest run packages/proxy/test`
  - `pnpm.cmd --filter @bc8-odx/proxy run verify`
  - `pnpm.cmd --filter @bc8-odx/explorer run verify`
  - `pnpm.cmd run lint`
  - `pnpm.cmd run typecheck`
  - `git diff --check`
- skipped checks and residual risk: No requested check was skipped. Initial
  sandboxed Vitest could not resolve `vitest`, and sandboxed package verify
  runs hit Windows `spawn EPERM` while starting esbuild; the same commands
  passed when rerun outside the sandbox with approval. No live SAP BTP SQL
  binding smoke test was performed.
- dependency check: `pnpm-lock.yaml` changed only the `packages/proxy`
  importer entry for the new direct `db0` dependency. Existing transitive db0
  package snapshots were reused.
- self-check result: Scope stayed on task 079. No evlog, metadata caching,
  Explorer database access, unredacted payload storage, public db0 API leak, or
  unrelated UI redesign was added. Persistent storage remains opt-in.
- review requirement decision: Separate review is required because this changes
  persistence, database initialization, production endpoint behavior,
  deployment configuration, dependency surface, and sensitive logging behavior.
- task state movement: `Move-Item` from `ready/` to `in-progress/` was blocked
  by Windows access denied, so task state was moved through patches. The task
  is now in `done/` after implementation and verification.
- `.agents/NEXT.md` update: Updated to request a fresh Reviewer for task 079
  before continuing to task 080.
- commit hash: `48e9432c2daa05e8aeb073979f06119f34c83491`.
- known gaps: PostgreSQL production use still depends on the db0 PostgreSQL
  connector's `pg` runtime peer being present in the deployment image, as
  documented. The task did not add or mandate a BTP SQL provider.
- integrator update 2026-05-08: Addressed the task 079 review finding by
  adding `pg` as a direct `@bc8-odx/proxy` runtime dependency and updating
  `pnpm-lock.yaml` with the required PostgreSQL dependency graph. Did not add
  `@types/pg` because proxy source and generated type flow do not import `pg`
  types directly; the required production smoke import is runtime-only.
  Verified the PostgreSQL connector import, focused db0 log-store test, proxy
  verify, workspace lint, workspace typecheck, and `git diff --check`. The
  focused Vitest and proxy verify checks needed approved outside-sandbox reruns
  after sandboxed Windows runner failures; the approved reruns passed.
  `.agents/NEXT.md` now requests focused re-review before task 079 approval.
