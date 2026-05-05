# Task: Fix Nuxt e2e startup on Node 24

Status: done
Owner: Erdos + Codex orchestrator
Created: 2026-05-05
Risk: medium
Review: conditional - required if Nuxt module runtime contracts change

## Objective

Restore the existing Nuxt e2e test suites under the current Node 24.13.1
runtime.

## Context

Verification commands that include Nuxt e2e projects fail while starting the
generated Nitro server, before task assertions run:

```txt
TypeError [ERR_INVALID_ARG_VALUE]: The argument 'filename' must be a file URL
object, file URL string, or absolute path string. Received 'file:///_entry.js'
GetPortError: Timeout waiting for port ... after 20 retries
```

Observed failing suites:

- `packages/nuxt/test/isolated.test.ts`
- `test/module.test.ts`

Relevant files:

- `packages/nuxt/test/isolated.test.ts`
- `packages/nuxt/test/module.test.ts`
- `packages/nuxt/test/fixtures/isolated/**`
- `test/fixtures/basic/**`
- `packages/nuxt/vitest.config.ts`
- root `vitest.config.ts`
- Nuxt/Nitro test-utils configuration

## Scope

- Reproduce the Node 24 e2e startup failure with the narrowest Nuxt test command.
- Identify whether the issue is local test configuration, Nuxt/Nitro test-utils
  output format, or unsupported Node/runtime combination.
- Fix the bounded test configuration issue if one is found.
- If the fix requires dependency upgrades or broad runtime policy decisions,
  document the blocker and propose the smallest safe follow-up.

## Non-Goals

- Do not change production ODX module behavior unless the failing test proves a
  real module bug.
- Do not weaken or delete Nuxt e2e coverage just to make checks pass.
- Do not add browser-mode verification for this task unless a dev-server UI
  path is changed; if needed, use port `3000`.

## Acceptance Criteria

- [x] The failing Nuxt e2e startup is reproduced with a narrow command.
- [x] Root cause is documented in handoff notes.
- [x] Either the Nuxt e2e tests pass again or a bounded blocker/follow-up is
      documented.
- [x] Existing focused Nuxt unit tests still pass.
- [x] `pnpm.cmd run typecheck` still passes.

## Verification

Task-local checks:

- `pnpm.cmd exec vitest run packages/nuxt/test/isolated.test.ts`
- `pnpm.cmd exec vitest run packages/nuxt/test/module.test.ts`
- `pnpm.cmd exec vitest run packages/nuxt/test/composables.test.ts packages/nuxt/test/generate.test.ts`
- `pnpm.cmd run typecheck`

Checkpoint or broad checks, if required:

- `pnpm.cmd run lint`

Setup/data prerequisites:

- Use `pnpm.cmd`, not `pnpm`, on this Windows machine because PowerShell blocks
  `.ps1` launchers.

If a check is skipped, record why and the residual risk in Handoff Notes.

## Risk Notes

Medium risk because this touches test infrastructure around Nuxt/Nitro runtime
behavior. Separate review is required if the implementation changes module
runtime contracts or production middleware behavior.

## Handoff Notes

- Reproduced on Node 24.13.1 with:
  - `pnpm.cmd exec vitest run packages/nuxt/test/isolated.test.ts`
  - `pnpm.cmd exec vitest run packages/nuxt/test/module.test.ts`
- Root cause: Nitro 2.13.2 emits `createRequire("file:///_entry.js")`
  for non-entry server chunks. Node 24 rejects that placeholder because it is
  not a file URL object, file URL string, or absolute path. `@nuxt/test-utils`
  then waits for the generated server port until timeout.
- Fix: added a test-local `nuxtConfig.nitro` override in both Nuxt e2e setup
  calls with `inlineDynamicImports: true` and `preset: "node-server"`. This
  keeps the generated test server in a single Node entry bundle and avoids the
  invalid placeholder without changing production module behavior or deleting
  e2e coverage.
- Verification passed:
  - `pnpm.cmd exec vitest run packages/nuxt/test/isolated.test.ts`
  - `pnpm.cmd exec vitest run packages/nuxt/test/module.test.ts`
  - `pnpm.cmd exec vitest run packages/nuxt/test/composables.test.ts packages/nuxt/test/generate.test.ts`
  - `pnpm.cmd run lint`
  - `pnpm.cmd run typecheck`
- Notes:
  - The e2e runs still print upstream Vue/Nuxt `DEP0155` deprecation warnings
    about trailing slash exports mappings on Node 24; they do not fail the
    tests.
  - Separate review is optional under `.agents/WORKFLOW.md` because the change
    is test-only and does not alter Nuxt module runtime contracts.
  - No commit was created because the operator explicitly instructed that the
    orchestrator will commit.
  - Orchestrator re-ran the focused e2e/unit checks plus lint/typecheck before
    moving the task to done.
