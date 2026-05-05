# Task: URI-encode Nuxt OData string keys

Status: done
Owner: Codex
Created: 2026-05-05
Risk: medium
Review: conditional - required if public composable URL behavior changes beyond key-literal encoding

## Objective

Make Nuxt OData composable helpers encode string key literals before they are
placed into request URLs so special characters in entity keys are routed as
data, not as path or query syntax.

## Context

The Nuxt runtime composable builds entity URLs for reads and mutations. String
keys such as `A/B?x=1&R` can contain characters that have URI meaning. These
keys should reach the OData endpoint as encoded key literal content.

This follows the stability queue after tasks 058-062. Task 058 made generated
registry declarations valid for non-identifier service names; this task is a
separate runtime URL correctness issue and must not duplicate registry
generation work.

Relevant docs and files:

- `AGENTS.md`
- `README.md`
- `CONTRIBUTING.md`
- `.agents/WORKFLOW.md`
- `.agents/tasks/done/058-quote-generated-registry-service-keys.md`
- `packages/nuxt/src/runtime/composables/useOData.ts`
- `packages/nuxt/test/composables.test.ts`

## Scope

- Add failing tests first for string-key URL construction with a key such as
  `A/B?x=1&R`.
- Cover `get()` for a single string key.
- Cover composite keys containing string members that need URI encoding.
- Cover routed mutation helpers for string keys, such as update, patch, or
  remove/delete, using the helper names already present in the composable test
  suite.
- Encode only OData key literal content before composing the URL path.
- Preserve existing behavior for numeric keys, simple string keys, entity-set
  paths, service routes, query option serialization, request payloads, and
  response handling.
- Keep changes inside the Nuxt package runtime composable and focused tests
  unless nearby helper extraction is clearly smaller and package-local.

## Non-Goals

- Do not change service configuration shape, generated registry declarations,
  metadata generation, proxy behavior, Explorer endpoints, package scripts,
  dependencies, lockfiles, or generated files.
- Do not redesign query serialization or route joining outside the key literal
  bug.
- Do not add browser or playground verification unless the implementation
  changes visible Nuxt playground behavior.

## Acceptance Criteria

- [x] A focused test fails before implementation for `get('A/B?x=1&R')` or the
  equivalent existing API shape.
- [x] String key literals are URI-encoded in generated request URLs.
- [x] Composite key string members are URI-encoded without changing key names or
  separators.
- [x] Routed mutation helper URLs encode string key literals.
- [x] Existing composable tests and Nuxt package verification remain green.

## Verification

Task-local checks:

- `pnpm.cmd --filter @bc8-odx/nuxt exec vitest run test/composables.test.ts`
- `pnpm.cmd --filter @bc8-odx/nuxt run verify`
- `pnpm.cmd run typecheck`
- `pnpm.cmd run lint`

Checkpoint or broad checks, if required:

- none unless the implementation broadens beyond Nuxt composable URL
  construction

Setup/data prerequisites:

- Use deterministic composable tests and local test fixtures only.
- Use `pnpm.cmd`, not `pnpm`, on this Windows machine because PowerShell blocks
  `.ps1` launchers.

If a check is skipped, record why and the residual risk in Handoff Notes.

## Risk Notes

Medium risk because Nuxt composable URL construction is public runtime
behavior. Separate review is not required if the change is narrowly limited to
encoding key literal content with focused tests and does not alter service
routes, query serialization, generated types, proxy behavior, or broader URL
joining semantics.

If the implementation changes general URL composition, query option
serialization, public helper signatures, or generated output, require an
independent review before continuing.

## Handoff Notes

- changed files
  - `packages/nuxt/src/runtime/composables/useOData.ts`
  - `packages/nuxt/test/composables.test.ts`
  - `packages/nuxt/test/imports.mock.ts`
  - `packages/nuxt/vitest.config.ts`
  - `.agents/tasks/done/063-uri-encode-nuxt-odata-string-keys.md`
  - `.agents/NEXT.md`
- summary
  - Added focused composable tests for `get('A/B?x=1&R')`, composite string
    key members, and routed `update()` URLs.
  - Added a package-local Vitest `#imports` alias/helper so the required direct
    composable test command resolves Nuxt virtual imports before applying test
    mocks.
  - Encoded string key literal content with `encodeURIComponent()` before the
    existing OData single-quote escaping and wrapping.
  - Preserved numeric keys, simple string keys, composite key names and
    separators, service routes, entity-set paths, query options, payloads, and
    response handling.
- tests run
  - Initial sandboxed run failed before assertions:
    `pnpm.cmd --filter @bc8-odx/nuxt exec vitest run test/composables.test.ts`
    could not access `C:\Users\janfr\AppData\Local\node\corepack\v1\pnpm`
    (`EPERM`), so the command was rerun with approved escalation.
  - Initial escalated direct composable run failed before assertions because
    `#imports` was unresolved by the existing package Vitest config for this
    direct test file.
  - FAIL before fix after the package-local test alias/helper:
    `pnpm.cmd --filter @bc8-odx/nuxt exec vitest run test/composables.test.ts`
    failed 3 tests. The URLs contained raw `A/B?x=1&R` where the tests expected
    `A%2FB%3Fx%3D1%26R`.
  - PASS: `pnpm.cmd --filter @bc8-odx/nuxt exec vitest run test/composables.test.ts`
    (25 tests passed).
  - PASS: `pnpm.cmd --filter @bc8-odx/nuxt run verify` (3 files, 14 tests, and
    minimal playground verification passed; existing Node DEP0155 warnings
    remained).
  - Initial `pnpm.cmd run typecheck` failed on the temporary virtual mock
    option and implicit `globalThis` helper typing.
  - PASS after cleanup: `pnpm.cmd run typecheck`.
  - Initial `pnpm.cmd run lint` failed on new test title casing and import
    ordering.
  - PASS after cleanup: `pnpm.cmd run lint`.
  - PASS: `git diff --check` (line-ending warnings only).
- skipped checks and residual risk
  - No checks were skipped.
  - Browser/playground UI verification was not added because the task only
    changes deterministic composable URL construction.
- self-check result
  - Scope stayed limited to Nuxt composable key literal encoding and focused
    composable test support. No route joining redesign, query serialization,
    payload handling, response transforms, generated registry output, proxy
    behavior, dependencies, or lockfiles changed.
- review requirement decision
  - Separate review is not required by the task policy because the public URL
    behavior change is limited to string key literal encoding and is covered by
    focused tests. The test-only Vitest alias/helper is package-local and does
    not affect runtime behavior.
- task state movement
  - Moved from `.agents/tasks/ready/` to `.agents/tasks/in-progress/` at start.
  - Moved to `.agents/tasks/done/` after implementation and verification.
- `.agents/NEXT.md` update
  - Updated to point at
    `.agents/tasks/ready/064-reject-malformed-benchmark-report-timing-fields.md`.
- commit hash
  - Commit containing this handoff.
- known gaps
  - Existing Node DEP0155 warnings still appear during Nuxt playground
    verification and are unchanged dependency warnings.
