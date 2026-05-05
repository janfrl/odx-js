# Task: Use HTTP client for Nuxt metadata downloads

Status: done
Owner: Codex
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

- [x] A focused test proves `http://.../$metadata` is requested through
  `node:http`.
- [x] Existing HTTPS metadata tests still prove `https://.../$metadata` uses
  `node:https` with the configured TLS option.
- [x] Request headers are preserved for HTTP and HTTPS metadata downloads.
- [x] Error handling for non-2xx responses remains clear.
- [x] Nuxt package verification remains green.

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

- changed files
  - `packages/nuxt/src/generate.ts`
  - `packages/nuxt/test/generate.test.ts`
  - `.agents/tasks/done/055-use-http-client-for-nuxt-metadata-downloads.md`
  - `.agents/NEXT.md`
- summary
  - Added a focused failing test proving `http://` metadata URLs should use
    `node:http` and preserve auth headers.
  - Strengthened the HTTPS test to assert `node:https` is used with the
    configured `rejectUnauthorized` option and that `node:http` is not called.
  - Updated `downloadMetadata()` to choose `node:http` for `http://` metadata
    URLs and `node:https` for `https://` metadata URLs.
  - Kept HTTPS-only `rejectUnauthorized` out of HTTP request options.
- tests run
  - FAIL before fix: `pnpm.cmd --filter @bc8-odx/nuxt exec vitest run test/generate.test.ts -t "HTTP client"`; the HTTP test failed because the implementation still called `https.get`.
  - PASS: `pnpm.cmd --filter @bc8-odx/nuxt exec vitest run test/generate.test.ts`
  - PASS: `pnpm.cmd --filter @bc8-odx/nuxt run verify`
  - PASS: `pnpm.cmd run typecheck`
  - PASS: `pnpm.cmd run lint`
- skipped checks and residual risk
  - No browser-mode or dev-server verification was run; the task uses mocked
    Node clients and package verification.
  - Existing Node DEP0155 warnings appeared during Nuxt playground verification
    and are unchanged dependency warnings.
- self-check result
  - Scope stayed limited to setup-time metadata client selection and focused
    tests. No service configuration shape, generated type output, odata2ts
    invocation, cache paths, fallback policy, dependencies, lockfiles, proxy
    runtime behavior, Nuxt runtime composables, or dev-server behavior changed.
- review requirement decision
  - Separate review is not required because the implementation stayed limited
    to scheme-specific client selection with focused tests and did not change
    public configuration contracts, TLS defaults, dependencies, generation
    fallback behavior, or runtime proxy/composable behavior.
- task state movement
  - Moved from `.agents/tasks/ready/` to `.agents/tasks/done/`.
- `.agents/NEXT.md` update
  - Updated to point at `.agents/tasks/ready/056-unwrap-falsy-v2-d-payloads.md`.
- commit hash
  - The task implementation commit is the commit containing this handoff.
- known gaps
  - None.
