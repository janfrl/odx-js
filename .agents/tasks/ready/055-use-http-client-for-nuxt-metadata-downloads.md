# Task: Use HTTP client for Nuxt metadata downloads

Status: ready
Owner: unassigned
Created: 2026-05-05
Risk: medium
Review: conditional - required if public configuration contracts, TLS defaults, dependencies, or generation fallback behavior change

## Objective

Allow Nuxt metadata generation to download `$metadata` from `http://` service
URLs using the correct Node HTTP client while preserving existing HTTPS
behavior.

## Context

`packages/nuxt/src/generate.ts` currently imports `node:https` and calls
`https.get()` for all remote metadata URLs. That is correct for `https://`
services but not for local or internal `http://` OData services. The fix should
be test-first and narrow because metadata generation is a setup-time package
boundary.

Relevant docs and files:

- `AGENTS.md`
- `CONTRIBUTING.md`
- `.agents/WORKFLOW.md`
- `README.md`
- `ARCHITECTURE.md`
- `packages/nuxt/src/generate.ts`
- `packages/nuxt/test/generate.test.ts`

## Scope

- Add focused tests that prove `downloadMetadata()` uses `node:http` for
  `http://` metadata URLs and `node:https` for `https://` metadata URLs.
- Preserve header forwarding behavior for both schemes.
- Preserve existing `rejectUnauthorized` behavior for HTTPS requests.
- Avoid passing HTTPS-only options to the HTTP client if that would be
  misleading or unsupported.
- Keep generation cache fallback, local EDMX handling, and type-generation
  command execution behavior unchanged.

## Non-Goals

- Do not change service configuration shape, generated type output,
  odata2ts invocation, cache paths, fallback policy, dependencies, lockfiles,
  proxy runtime behavior, or Nuxt runtime composables.
- Do not introduce a new fetch library unless the existing Node clients cannot
  satisfy the task.
- Do not add browser-mode verification or run dev servers.

## Acceptance Criteria

- [ ] A focused test proves `http://.../$metadata` is requested through
  `node:http`.
- [ ] Existing HTTPS metadata tests still prove `https://.../$metadata` uses
  `node:https` with the configured TLS option.
- [ ] Request headers are preserved for HTTP and HTTPS metadata downloads.
- [ ] Error handling for non-2xx responses remains clear.
- [ ] Nuxt package verification remains green.

## Verification

Task-local checks:

- `pnpm.cmd --filter @bc8-odx/nuxt exec vitest run test/generate.test.ts`
- `pnpm.cmd --filter @bc8-odx/nuxt run verify`
- `pnpm.cmd run typecheck`

Checkpoint or broad checks, if required:

- `pnpm.cmd run lint`

Setup/data prerequisites:

- Use mocked Node `http` and `https` clients in tests; do not depend on a real
  network service.
- Use `pnpm.cmd`, not `pnpm`, on this Windows machine because PowerShell blocks
  `.ps1` launchers.

If a check is skipped, record why and the residual risk in Handoff Notes.

## Risk Notes

Medium risk because this touches setup-time external metadata downloads in the
Nuxt package. Separate review is not required if the implementation stays
limited to scheme-specific client selection with focused tests and does not
change public configuration contracts, TLS defaults, dependencies, generation
fallback behavior, or runtime proxy/composable behavior.

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

