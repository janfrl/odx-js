# Task: Audit DevTools log data exposure

Status: done
Owner: Codex
Created: 2026-05-05
Risk: medium
Review: conditional - required if implementation changes telemetry storage or
security-sensitive behavior

## Objective

Determine whether DevTools traffic logs currently store sensitive data in a way
that needs a concrete, predictable fix.

## Context

The previous planning note proposed header-name-based redaction. The operator
rejected that as too unpredictable. This task replaces that implementation idea
with a tests-first audit. Do not introduce broad redaction based only on header
names.

Relevant files:

- `SECURITY.md`
- `packages/proxy/src/api/odata.ts`
- `packages/proxy/src/utils/trace.ts`
- `packages/core/src/dev-logs.ts`
- `packages/proxy/test/dev-logs.test.ts`
- `packages/proxy/test/integration.test.ts`
- `packages/explorer/components/tabs/TabLogs.vue`

## Scope

- Identify exactly which request and response data is stored in DevTools logs.
- Write focused tests or inspection notes that demonstrate any real exposure
  risk before changing behavior.
- If a concrete leak is verified, propose the smallest predictable fix.
- Prefer source-aware fixes over broad header-name heuristics. Examples:
  configured `auth` credentials should not be logged because ODX created them;
  arbitrary user headers should not be silently rewritten without a documented
  rule.
- If no clear bug is verified, record the finding and leave behavior unchanged.

## Non-Goals

- Do not implement broad header-name-based redaction.
- Do not remove traffic logs or header inspection from Explorer.
- Do not change outbound proxy header forwarding behavior.
- Do not redesign `TabLogs.vue`.

## Acceptance Criteria

- [ ] The task documents what DevTools logs store today.
- [ ] Any implementation change is preceded by a failing test or a concrete
      reproduction.
- [ ] No broad, unpredictable header-name redaction is introduced.
- [ ] If no bug is verified, the task closes with notes instead of code churn.
- [ ] If a fix is implemented, focused tests cover the verified case.

## Verification

Task-local checks:

- `pnpm.cmd run test -- packages/proxy`
- `pnpm.cmd run typecheck`

Checkpoint or broad checks, if required:

- `pnpm.cmd run test`
- `pnpm.cmd run lint`

Setup/data prerequisites:

- Use `pnpm.cmd`, not `pnpm`, on this Windows machine because PowerShell blocks
  `.ps1` launchers.

If a check is skipped, record why and the residual risk in Handoff Notes.

## Risk Notes

Medium by default because this is an audit. If implementation changes telemetry
storage, auth handling, or security-sensitive behavior, reclassify as high risk
and require separate review.

## Handoff Notes

- changed files: `packages/proxy/src/api/odata.ts`,
  `packages/proxy/test/integration.test.ts`, `.agents/NEXT.md`, and this task
  file
- summary: verified with a failing test that DevTools logs stored
  ODX-managed Basic auth generated from service config; changed the logged
  header copy to omit only the authorization value that matches the
  ODX-managed backend auth header while preserving outbound forwarding and
  ordinary visible debug headers
- tests run:
  - `pnpm.cmd run test -- packages/proxy/test/integration.test.ts` failed
    before the fix and passed after the fix
  - `pnpm.cmd run test -- packages/proxy`
  - `pnpm.cmd run typecheck`
  - `pnpm.cmd run lint`
- skipped checks and residual risk: full root test suite was not rerun after
  the final focused proxy-suite pass; proxy suite invocation currently runs the
  repository Vitest set because of package script argument forwarding
- self-check result: scope, acceptance criteria, security guidance, and
  unrelated changes checked; no broad header-name redaction was added
- review requirement decision: separate review required because implementation
  changes security-sensitive DevTools telemetry storage
- task state movement: move from `.agents/tasks/ready/` to
  `.agents/tasks/done/`
- `.agents/NEXT.md` update: point to a Reviewer prompt for this task
- commit hash: pending commit at handoff-note update time
- known gaps: independent review is still required before this change should be
  considered merge-ready

Review update:

- initial review found that hook/rule-injected non-auth headers were no longer
  reflected in DevTools logs
- focused fix preserved those log updates while still omitting the exact
  ODX-managed authorization value
- focused re-review approved the change
