# Review: Add db0-backed Explorer log store

Status: complete
Date: 2026-05-08
Reviewer: Codex
Task: `.agents/tasks/done/079-add-db0-backed-explorer-log-store.md`
Reviewed commit: `48e9432c2daa05e8aeb073979f06119f34c83491`
Decision: approved after focused fix

## Findings

1. [P1] PostgreSQL SQL log storage cannot start from the documented deployment
   package: needs changes. `packages/proxy/src/utils/log-store.ts:90`
   dynamically imports `db0/connectors/postgresql` when
   `NUXT_ODATA_DEVTOOLS_LOG_DB_CONNECTOR=postgresql` is selected, and
   `DEPLOYMENT.md:142`-`146` documents that as the production BTP path.
   However, `packages/proxy/package.json:15`-`25` declares `db0` but not `pg`.
   The official db0 PostgreSQL connector docs say the connector requires
   installing `pg` and `@types/pg`
   (https://db0.unjs.io/connectors/postgresql). The installed db0 connector
   imports `pg`, `pnpm-lock.yaml` has no `pg` or `@types/pg` package entry, and
   `pnpm.cmd --filter @bc8-odx/proxy exec node -e "import('db0/connectors/postgresql')..."`
   fails with `ERR_MODULE_NOT_FOUND`. As a result, the documented production
   SQL configuration will fail during store initialization before any
   `/__odx__/logs` persistence works. Add `pg` as a proxy runtime dependency
   and update the lockfile; add `@types/pg` only if the package or generated
   type flow needs it. Keep the adapter behind `OdxLogStore`.

## Acceptance Criteria

- [x] Persistent log storage can be enabled through configuration: partial.
  The SQL branch resolves from config/env and works with the fake db0 adapter,
  but the documented PostgreSQL production path is not deployable without the
  missing `pg` runtime dependency.
- [x] Memory storage remains available and tested: pass.
- [x] db0 implementation is isolated behind the ODX log store interface: pass.
  db0 usage is confined to proxy-owned `log-store.ts` and `db0-log-store.ts`;
  Explorer and public ODX contracts do not expose db0 APIs.
- [x] Explorer log list and clear flows work against the persistent store:
  pass in focused tests and review inspection.
- [x] Production docs explain BTP database binding expectations and SQLite
  limitations: partial. The docs correctly describe bindings and SQLite
  limits, but the documented PostgreSQL path currently depends on an undeclared
  runtime package.

## Verification

Run or inspect:

- `git show --stat --oneline --no-renames 48e9432c2daa05e8aeb073979f06119f34c83491` - reviewed.
- `git show --no-ext-diff --unified=80 --no-renames 48e9432c2daa05e8aeb073979f06119f34c83491 -- packages/proxy/src/utils/trace.ts packages/proxy/src/utils/log-store.ts packages/proxy/src/utils/db0-log-store.ts packages/proxy/src/api/logs.ts packages/proxy/package.json pnpm-lock.yaml DEPLOYMENT.md` - reviewed.
- `Get-Content`/line-number inspection of `packages/proxy/src/utils/trace.ts`,
  `packages/proxy/src/utils/log-store.ts`,
  `packages/proxy/src/utils/db0-log-store.ts`,
  `packages/proxy/src/api/logs.ts`, `packages/core/src/dev-logs.ts`,
  `packages/core/src/types.ts`, `packages/nuxt/src/config.ts`,
  `packages/nuxt/src/module.ts`, `packages/proxy/package.json`,
  `DEPLOYMENT.md`, `SECURITY.md`, `API.md`, and `ARCHITECTURE.md` - reviewed.
- Official db0 PostgreSQL connector docs
  `https://db0.unjs.io/connectors/postgresql` - reviewed; docs require
  installing `pg` and `@types/pg`.
- `Select-String -Path pnpm-lock.yaml -Pattern "@types/pg|pg@|^\s+pg:|/pg"` - pass for evidence; no `pg` or `@types/pg` package entry found.
- `pnpm.cmd --filter @bc8-odx/proxy exec node -e "import('db0/connectors/postgresql').then(()=>console.log('ok')).catch(e=>{console.error(e.code||e.message); process.exit(1)})"` - fail as expected; `ERR_MODULE_NOT_FOUND`.
- `pnpm.cmd --filter @bc8-odx/proxy exec node -e "import('db0/connectors/node-sqlite').then(()=>console.log('ok')).catch(e=>{console.error(e.code||e.message); process.exit(1)})"` - pass.
- `pnpm.cmd exec vitest run packages/proxy/test/db0-log-store.test.ts` - pass outside sandbox; 1 file, 5 tests.
- `pnpm.cmd exec vitest run packages/proxy/test` - pass outside sandbox; 11 files, 148 passed, 1 skipped.
- `pnpm.cmd --filter @bc8-odx/proxy run verify` - pass outside sandbox; proxy tests plus standalone example passed.
- `pnpm.cmd --filter @bc8-odx/explorer run verify` - pass outside sandbox; 1 file, 34 tests.
- `pnpm.cmd run lint` - pass outside sandbox.
- `pnpm.cmd run typecheck` - pass outside sandbox.
- `git diff --check` - pass.

## Residual Risk

- The test suite uses a fake db0 adapter and does not exercise a real
  PostgreSQL connection or SAP BTP binding.
- No live SAP BTP SQL smoke test was performed.
- Sandboxed Vitest/package verify attempts failed with runner resolution or
  Windows `spawn EPERM`; the same commands passed outside the sandbox with
  approval.

## Open Questions

- None.

## Test Gaps

- Add a focused import/dependency smoke check for the selected PostgreSQL
  connector, or otherwise cover production connector initialization in a way
  that fails when required runtime peers are missing.

## Summary

Task 079 correctly keeps db0 behind the proxy-owned `OdxLogStore` boundary,
keeps memory storage as the default, enables production logs only when SQL
storage is explicitly configured, and forces request/response payload bodies
off in production. Production payload persistence semantics are verified in
`packages/proxy/src/utils/trace.ts:10`, where `storePayloads` requires
`NODE_ENV !== 'production'`, and in
`packages/proxy/test/db0-log-store.test.ts`, which asserts production request
and response payloads are omitted.

The task needs a focused fix because the documented PostgreSQL production path
is not deployable without the required `pg` runtime dependency.

## Next Action

- Integrator update 2026-05-08: The focused fix added `pg` as a direct
  `@bc8-odx/proxy` runtime dependency and updated `pnpm-lock.yaml`. `@types/pg`
  was not added because the package does not import `pg` types directly.
  Verification passed for the PostgreSQL connector import, focused db0
  log-store test, proxy verify, workspace lint, workspace typecheck, and
  `git diff --check`.
- Focused re-review 2026-05-08: approved. `packages/proxy/package.json` now
  declares `pg` as a runtime dependency, `pnpm-lock.yaml` contains only the
  expected PostgreSQL dependency graph, `@types/pg` remains absent because the
  package does not import `pg` types, the PostgreSQL db0 connector import
  passed, and `git diff --check` passed.
- `.agents/NEXT.md` was updated to continue with task 080.
