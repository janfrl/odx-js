# Task: Sanitize Explorer metadata failure messages

Status: done
Owner: Codex
Created: 2026-05-08
Risk: high
Review: required

## Objective

Ensure production Explorer metadata refresh, schema, and config responses never
expose backend metadata URLs, hostnames, or deployment paths through failure
messages or legacy metadata cache state.

## Context

Tasks 080 and 081 separated production metadata refresh from SDK generation and
moved schema/config reads onto runtime metadata cache state. The task 081 review
fixed one stale-cache fallback path, but its residual risk notes that legacy
metadata state files created before the fix could still contain raw stale
reasons until another refresh rewrites them. The no-cache refresh failure path
also still needs focused verification so `/__odx__/generate` does not return a
raw metadata URL in production error responses.

Relevant files:

- `.agents/reviews/080-separate-runtime-metadata-refresh-from-sdk-generation-review.md`
- `.agents/reviews/081-use-runtime-metadata-cache-for-schema-and-config-review.md`
- `SECURITY.md`
- `API.md`
- `packages/proxy/src/utils/metadata-refresh.ts`
- `packages/proxy/src/api/generate.ts`
- `packages/proxy/src/api/config.ts`
- `packages/proxy/src/api/schema.ts`
- `packages/proxy/test/explorer-policy.test.ts`

## Scope

Include:

- Sanitize metadata failure reasons before they are exposed by production
  Explorer runtime responses, including `/__odx__/generate` errors without a
  cache fallback.
- Sanitize stale reasons read from existing runtime metadata sidecar files
  before `/__odx__/config` or `/__odx__/schema` serialize them.
- Preserve actionable status-code reasons such as `Status: 503`.
- Add focused production tests that prove internal metadata URLs and hostnames
  are absent from generate/config/schema responses.
- Keep the fix in the proxy metadata/runtime API boundary.

## Non-Goals

- Do not change metadata cache file names or introduce a migration command.
- Do not change TypeScript SDK generation behavior.
- Do not change normal OData proxy responses.
- Do not add a live SAP BTP smoke test.
- Do not change Explorer UI copy unless a test requires a response shape
  compatibility fix.

## Acceptance Criteria

- [x] Production `/__odx__/generate` failures without a cache fallback do not
      expose backend metadata URLs, hostnames, or local runtime paths.
- [x] Production `/__odx__/config` and `/__odx__/schema` sanitize stale reasons
      loaded from legacy metadata state sidecar files.
- [x] Status-code stale reasons remain visible enough to be actionable.
- [x] Focused tests cover no-cache refresh failure and legacy sidecar stale
      reason exposure.
- [x] Existing production metadata refresh and stale-cache fallback behavior
      remains intact.

## Verification

Task-local checks:

- `pnpm.cmd exec vitest run packages/proxy/test/explorer-policy.test.ts`
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

High risk because this touches production Explorer runtime API error exposure
and metadata cache privacy. Separate review is required under the workflow
review policy for security/privacy and production runtime API behavior.

## Handoff Notes

- changed files: `packages/proxy/src/utils/metadata-refresh.ts`,
  `packages/proxy/src/api/generate.ts`, `packages/proxy/src/api/config.ts`,
  `packages/proxy/src/api/schema.ts`,
  `packages/proxy/test/explorer-policy.test.ts`, `.agents/NEXT.md`, and this
  task file.
- summary: Exported and strengthened the metadata failure sanitizer so
  production Explorer runtime responses remove backend metadata URLs,
  hostnames, Windows/UNC paths, and absolute runtime paths while preserving
  actionable status-code text such as `Status: 503`. Production
  `/__odx__/generate` now returns sanitized no-cache refresh failures, and
  production `/__odx__/config` plus `/__odx__/schema` sanitize stale or missing
  metadata reasons loaded from runtime cache state before serializing them.
  Normal OData proxy responses, cache file names, TypeScript SDK generation,
  dependencies, generated files, and Explorer UI copy were not changed.
- tests run:
  - `pnpm.cmd exec vitest run packages/proxy/test/explorer-policy.test.ts` -
    pass outside sandbox; 1 file, 20 tests passed.
  - `pnpm.cmd --filter @bc8-odx/proxy run verify` - pass outside sandbox; 11
    proxy test files passed, 164 tests passed, 1 skipped, standalone proxy
    example passed.
  - `pnpm.cmd run lint` - pass after fixing one regexp lint finding.
  - `pnpm.cmd run typecheck` - pass.
  - `git diff --check` - pass with Git line-ending warnings only.
- skipped checks and residual risk: No task-required checks were skipped. The
  initial sandboxed focused Vitest run failed because `vitest` could not be
  resolved, and the initial sandboxed proxy verify failed with Windows
  `spawn EPERM` while loading Vitest config through esbuild; both commands
  passed when rerun outside the sandbox. No live SAP BTP Destination,
  Connectivity, XSUAA, or customer backend smoke test was performed because
  the task explicitly excluded live BTP smoke testing.
- pre-fix failing result: No behavioral pre-fix test run was recorded before
  implementation; the focused regression tests were added and verified after
  the sanitizer fix. The only pre-fix failures observed were sandbox/tooling
  failures listed above.
- self-check result: Scope stayed on task 087 and the proxy
  metadata/runtime API boundary. The implementation sanitizes production
  response exposure without changing normal OData proxy responses, SDK
  generation semantics, cache file names, dependencies, lockfiles, generated
  files, Explorer UI code, or unrelated documentation. `SECURITY.md` and
  `API.md` already described the desired sanitized production behavior, so no
  durable documentation changes were required.
- review requirement decision: Separate review is required because task 087 is
  marked review-required and touches production Explorer runtime API error
  exposure plus metadata cache privacy.
- task state movement: Moved from `ready/` to `in-progress/` when starting
  after a sandboxed `Move-Item` access-denied failure was rerun with approval;
  moved from `in-progress/` to `done/` after implementation and verification.
- `.agents/NEXT.md` update: Updated to request a fresh Reviewer for completed
  task 087.
- commit hash: pending commit.
- known gaps: No live BTP smoke test was added by design. Development-mode
  diagnostics remain less restricted except for stale metadata that has already
  been sanitized when written by production-compatible refresh paths.
