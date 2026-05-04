# Task: Redact sensitive DevTools headers

Status: ready
Owner: unassigned
Created: 2026-05-04
Risk: high
Review: required

## Objective

Prevent sensitive request header values from being stored or displayed in ODX
DevTools traffic logs.

## Context

`packages/proxy/src/api/odata.ts` passes `finalHeaders` into
`DevToolsTracer.initLog()`. `packages/core/src/dev-logs.ts` stores those headers
in memory and `packages/explorer/components/tabs/TabLogs.vue` displays them.
The security documentation explicitly calls out authorization, cookie,
set-cookie, API keys, and SAP session tokens as values that should be redacted
when headers are stored or shown.

Relevant files:

- `SECURITY.md`
- `packages/proxy/src/api/odata.ts`
- `packages/proxy/src/utils/trace.ts`
- `packages/core/src/dev-logs.ts`
- `packages/proxy/test/dev-logs.test.ts`
- `packages/proxy/test/integration.test.ts` or a focused new proxy test

## Scope

- Add a reusable redaction helper at the appropriate layer.
- Redact sensitive header values before logs are stored.
- Preserve non-sensitive headers for Explorer diagnostics.
- Add focused tests proving sensitive header names are redacted regardless of
  casing.
- Keep production logging disabled behavior unchanged.

## Non-Goals

- Do not remove the traffic log feature.
- Do not redact every header blindly.
- Do not change outbound proxy header forwarding behavior.
- Do not redesign `TabLogs.vue`.

## Acceptance Criteria

- [ ] Logged request headers redact at least `authorization`, `cookie`,
      `set-cookie`, `x-api-key`, SAP session tokens, and similarly named token
      headers.
- [ ] Non-sensitive headers remain visible in development logs.
- [ ] Header redaction is covered by focused tests.
- [ ] Existing proxy tests still pass.
- [ ] Security documentation remains accurate; update it only if the durable
      behavior changes beyond the current guidance.

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

High risk because this touches sensitive data handling and DevTools telemetry.
Separate review is required under `.agents/WORKFLOW.md`.

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
