# Task: Reject path-separator service names before type generation

Status: done
Owner: Codex
Created: 2026-05-05
Risk: medium
Review: required

## Objective

Fail Nuxt type generation early for configured service names that contain path
separators, before the service name can be used to build generated SDK output
paths.

## Context

Recent tasks made generated registry declarations valid for non-identifier
service names and verified a minimal playground service named `Sales-Order`.
That does not mean every string is a safe generated package name. Service names
containing `/` or `\` can be interpreted as path separators when generation
builds package output paths such as `.odx/<serviceName>`.

This task should reject path-separator service names narrowly before Nuxt type
generation, without changing support for safe non-identifier names such as
`Sales-Order`.

Relevant files:

- `AGENTS.md`
- `README.md`
- `CONTRIBUTING.md`
- `.agents/WORKFLOW.md`
- `.agents/tasks/done/058-quote-generated-registry-service-keys.md`
- `.agents/tasks/done/061-document-service-name-type-generation-limits.md`
- `.agents/tasks/done/065-verify-non-identifier-service-names-in-minimal-nuxt-playground.md`
- `packages/nuxt/src/generate.ts`
- `packages/nuxt/test/generate.test.ts`

## Scope

- Add failing tests first for service names containing `/` and `\` in the Nuxt
  type generation path.
- Reject path-separator service names before `generateODataTypes()` receives an
  output directory derived from the service name.
- Include an actionable error message that names the invalid service and states
  that path separators are not allowed.
- Preserve support for safe non-identifier names already covered by prior
  tasks, including `Sales-Order`.
- Keep validation local to Nuxt setup/type generation; use a tiny helper only
  if it keeps the implementation clearer and package-local.

## Non-Goals

- Do not reject all non-identifier service names.
- Do not change generated registry declaration quoting, model output layout for
  valid services, metadata download behavior, runtime composable lookup,
  Explorer behavior, proxy behavior, dependencies, lockfiles, or generated
  files.
- Do not add broad schema validation for every service config field.

## Acceptance Criteria

- [x] A focused test fails before implementation for a service name such as
  `Sales/Order` or `Sales\\Order`.
- [x] Nuxt type generation rejects service names containing `/` or `\` before
  invoking `odata2ts` or writing generated output under that service name.
- [x] Safe non-identifier service names such as `Sales-Order` remain supported.
- [x] The thrown error is specific enough for a module user to fix the config.
- [x] Focused Nuxt generation checks remain green.

## Verification

Task-local checks:

- `pnpm.cmd --filter @bc8-odx/nuxt exec vitest run test/generate.test.ts`
- `pnpm.cmd --filter @bc8-odx/nuxt run verify`
- `pnpm.cmd run typecheck`
- `pnpm.cmd run lint`

Checkpoint or broad checks, if required:

- none unless the implementation broadens beyond Nuxt type-generation
  validation

Setup/data prerequisites:

- Use local Nuxt generation fixtures only.
- Use `pnpm.cmd`, not `pnpm`, on this Windows machine because PowerShell blocks
  `.ps1` launchers.

If a check is skipped, record why and the residual risk in Handoff Notes.

## Risk Notes

Medium risk because this changes public Nuxt config validation behavior and can
turn previously accepted service names into setup-time errors. Separate review
is required to verify the validation boundary, error message, and compatibility
for safe non-identifier service names.

## Handoff Notes

- changed files
  - `packages/nuxt/src/generate.ts`
  - `packages/nuxt/test/generate.test.ts`
  - `.agents/tasks/done/073-reject-path-separator-service-names-before-type-generation.md`
  - `.agents/NEXT.md`
- summary
  - Added Nuxt `prepare:types` tests for `Sales/Order` and `Sales\\Order`
    service names, asserting they reject before the mocked `odata2ts` process
    is invoked.
  - Added a compatibility test proving `Sales-Order` still reaches type
    generation with the existing valid output layout.
  - Added a narrow Nuxt type-generation service-name validator that rejects `/`
    and `\` before remote temp/cache paths or SDK output directories are
    derived from the service name.
  - Preserved generated registry quoting, metadata download behavior, runtime
    composables, Explorer/proxy behavior, dependencies, lockfiles, and generated
    files.
- failing-first proof
  - Initial sandboxed run failed with `EPERM: operation not permitted, opendir
    'C:\Users\janfr\AppData\Local\node\corepack\v1\pnpm'`; reran with
    escalation for Corepack cache access.
  - FAIL before implementation: `pnpm.cmd --filter @bc8-odx/nuxt exec vitest
    run test/generate.test.ts`
  - Failure output included:
    `AssertionError: promise resolved "[ { path: 'C:/Users/janfr/AppData/...'
    } ]" instead of rejecting` for both `Sales/Order` and `Sales\Order`.
- tests run
  - PASS: `pnpm.cmd --filter @bc8-odx/nuxt exec vitest run
    test/generate.test.ts`
  - PASS: `pnpm.cmd --filter @bc8-odx/nuxt run verify`
  - PASS: `pnpm.cmd run typecheck`
  - PASS: `pnpm.cmd run lint`
  - PASS: `git diff --check`
- skipped checks and residual risk
  - No required checks were skipped.
  - Nuxt package verification emitted existing Node `DEP0155` trailing slash
    package export deprecation warnings from dependencies.
  - `git diff --check` emitted CRLF normalization warnings for the edited Nuxt
    source and test files; no whitespace errors were reported.
  - Verification did not leave tracked generated byproducts in `git status`.
- self-check result
  - Scope stayed limited to Nuxt type-generation validation and focused tests.
    The validator runs only for services with metadata URLs that enter type
    generation, and it does not reject safe non-identifier names such as
    `Sales-Order`.
- review requirement decision
  - Separate review is required because the task explicitly requires review and
    changes public Nuxt config validation behavior.
- task state movement
  - Moved from `.agents/tasks/ready/` to `.agents/tasks/in-progress/` at start.
  - Moved to `.agents/tasks/done/` after implementation and verification.
- `.agents/NEXT.md` update
  - Updated to a Reviewer prompt for task 073.
- commit hash
  - No commit created; the operator explicitly instructed that the orchestrator
    will review and commit.
- known gaps
  - None.
