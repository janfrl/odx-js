# Review: DevTools log data exposure

Task: `.agents/tasks/done/002-audit-devtools-log-data-exposure.md`
Commit reviewed: `b726903`
Reviewer: delegated reviewer
Date: 2026-05-05
Result: approved after focused fix

## Initial Findings

- P2: The first implementation cloned `finalHeaders` before hooks and rules ran,
  which meant hook- or rule-injected non-auth headers were forwarded to the
  backend but no longer visible in DevTools `requestHeaders`.

## Fix Reviewed

- `packages/proxy/src/api/odata.ts` now keeps a separate `loggedHeaders` copy,
  omits the exact ODX-managed authorization value before logging, re-syncs
  post-hook/rule header mutations into the log copy, and omits the same managed
  authorization value again.
- `packages/proxy/test/integration.test.ts` verifies that a hook-injected
  non-auth header is forwarded and visible in DevTools logs while the
  ODX-managed authorization value is omitted from the log copy.

## Verification

- `pnpm.cmd exec vitest run packages/proxy/test/integration.test.ts`
- `pnpm.cmd run test`
- `pnpm.cmd run typecheck`
- `pnpm.cmd run lint`

## Approval

Approved. No actionable findings remained after focused re-review.
