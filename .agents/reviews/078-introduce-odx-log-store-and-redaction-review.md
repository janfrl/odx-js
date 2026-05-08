# Review: Introduce ODX log store and redaction

Status: complete
Date: 2026-05-08
Reviewer: Codex
Task: `.agents/tasks/done/078-introduce-odx-log-store-and-redaction.md`
Reviewed commit: `c9ef7aa865ad2c6147af8581bb19dbd054bcbeeb`
Decision: needs changes

## Findings

1. [P1] Proxy trace details can still persist sensitive header values.
   `packages/proxy/src/utils/rules.ts:152` records `denyIfHeader` trace
   details with `actual` and `deniedValue`, and
   `packages/proxy/src/utils/rules.ts:173` records `injectHeader` trace
   details with `{ name, value, policy: 'HeaderInjection' }`. Those values can
   be API keys, SAP session tokens, CSRF tokens, or other configured secret
   headers. The new storage sanitizer only redacts top-level `requestHeaders`
   at `packages/core/src/dev-logs.ts:200`; for `proxyTrace` it passes each
   `entry.details` through `boundLogPayload` at
   `packages/core/src/dev-logs.ts:203`, which bounds size but does not redact
   nested header names or values. This fails the redaction boundary for
   sensitive headers before storage and can leak secrets into local Explorer
   traffic logs and future persistent store adapters. Smallest safe fix:
   sanitize `proxyTrace.details` before persistence, covering known rule trace
   shapes and nested objects keyed by sensitive header names; add a focused
   test proving injected/denied sensitive header values are redacted in stored
   `proxyTrace` entries.

2. [P3] Tracked API reference artifact was not refreshed for the new public log
   exports. `API.md:143` documents the new core/proxy log exports including
   `OdxLogStore`, `OdxMemoryLogStore`, `getODataLog`,
   `redactSensitiveHeaders`, `boundLogPayload`, and `sanitizeODataLog`, but
   `docs/public/api-reference.json:102` through
   `docs/public/api-reference.json:140` still only contains the old log helper
   set and old signatures. Running `pnpm.cmd --filter docs run verify`
   regenerated the missing items and updated the `devtools` option shape, so
   the tracked docs artifact is stale. Since the repository tracks this file
   and README says docs verify regenerates API reference metadata, task 078
   should include that generated docs update or explicitly document why the
   public docs artifact is intentionally deferred.

## Acceptance Criteria

- [x] Existing local Explorer traffic logs still work with the memory store:
  pass.
- [ ] Sensitive headers such as authorization, cookie, set-cookie, API keys,
  SAP session tokens, and CSRF tokens are redacted before storage: fail because
  sensitive header values can remain in `proxyTrace.details`.
- [x] Large request/response bodies are bounded or omitted according to a
  documented policy: pass.
- [x] Store operations are covered by focused tests: pass for append, update,
  list, get, clear, and payload policy; missing trace-detail redaction coverage
  is captured in finding 1.
- [ ] Public/core exports remain intentional and documented: partial fail
  because root `API.md` is updated, but the tracked generated API reference is
  stale.

## Verification

Run or inspect:

- `git show --stat --oneline --no-renames c9ef7aa865ad2c6147af8581bb19dbd054bcbeeb` - pass.
- `git show --no-ext-diff --unified=80 --no-renames c9ef7aa865ad2c6147af8581bb19dbd054bcbeeb -- packages/core/src/dev-logs.ts packages/proxy/src/api/logs.ts packages/proxy/src/api/odata.ts packages/proxy/src/utils/trace.ts packages/proxy/src/index.ts` - reviewed.
- `Get-Content packages/proxy/src/utils/rules.ts` with line numbers - reviewed; confirmed trace detail secret sources.
- `Select-String docs/public/api-reference.json` for new log-store exports - fail; artifact stale before docs verify.
- `pnpm.cmd exec vitest run packages/proxy/test/integration.test.ts` - initial sandbox run could not resolve `vitest`; elevated rerun passed, 14 tests.
- `pnpm.cmd exec vitest run packages/proxy/test/rules.test.ts` - initial sandbox run could not resolve `vitest`; elevated rerun passed, 20 tests.
- `pnpm.cmd --filter @bc8-odx/proxy run verify` - initial sandbox run failed with `spawn EPERM` while loading Vitest/esbuild; elevated rerun passed, 10 files, 140 tests passed, 1 skipped, standalone proxy example passed.
- `pnpm.cmd --filter @bc8-odx/explorer run verify` - initial sandbox run failed with `spawn EPERM` while loading Vitest/esbuild; elevated rerun passed, 34 tests.
- `pnpm.cmd run lint` - pass.
- `pnpm.cmd run typecheck` - pass.
- `pnpm.cmd --filter docs run verify` - pass; regenerated `docs/public/api-reference.json`, confirming the stale artifact finding. Generated verification byproducts were removed from the review worktree.

## Residual Risk

- No live SAP BTP/AppRouter smoke test was performed. This is acceptable for
  task 078 because production `/__odx__/logs` remains disabled and AppRouter
  routing was not changed.
- A future persistent log store would make the proxy-trace leak more durable;
  fix finding 1 before starting task 079 db0 storage work.

## Open Questions

- None.

## Test Gaps

- Add a focused test that stores rule-generated `proxyTrace` details for
  `injectHeader` and `denyIfHeader` using sensitive header names and verifies
  no sensitive value is retained.
- Add or rerun docs API extraction in the task verification when public/core
  exports change.

## Summary

The log store boundary, async-compatible API shape, production-disabled
`/__odx__/logs` policy, and local memory-store behavior are broadly in scope
and pass the requested automated checks. The review blocks approval because
redaction currently misses sensitive values inside proxy trace details, and the
tracked generated API reference was not refreshed for the new public exports.

## Next Action

- `.agents/NEXT.md` was updated to request a focused Integrator for the two
  findings above.
- Follow-up task or fix required: yes, fix findings 1 and 2 before task 079.
