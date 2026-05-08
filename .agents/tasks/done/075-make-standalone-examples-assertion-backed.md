# Task: Make standalone examples assertion-backed

Status: done
Owner: Codex
Created: 2026-05-05
Risk: low
Review: not required

## Objective

Strengthen the standalone core and proxy examples so they fail clearly when
their expected fixture behavior regresses, instead of only printing output or
implicitly relying on thrown runtime errors.

## Context

The repository already has package-local verification commands that run
`examples/core-standalone.ts` and `examples/proxy-standalone.ts`. The examples
are useful package-isolation smoke checks, but they should include explicit
assertions for the behavior they demonstrate so package verification catches
fixture drift and silent regressions.

Relevant files:

- `AGENTS.md`
- `README.md`
- `CONTRIBUTING.md`
- `.agents/WORKFLOW.md`
- `.agents/PACKAGE_ISOLATION.md`
- `.agents/tasks/done/010-add-core-proxy-standalone-examples.md`
- `.agents/tasks/done/023-add-package-local-verify-scripts.md`
- `examples/core-standalone.ts`
- `examples/proxy-standalone.ts`
- `packages/core/package.json`
- `packages/proxy/package.json`

## Scope

- Add explicit assertion-backed checks to the existing standalone examples.
- Cover the core example's demonstrated EDMX version detection, entity
  extraction, query stringification, response flattening, and low-level helper
  behavior where those examples already exercise it.
- Cover the proxy example's demonstrated proxied OData read and forwarded
  header behavior.
- Keep examples runnable through existing scripts; do not introduce a test
  runner dependency for the examples.
- Preserve the examples' role as lightweight package-isolation smoke checks.

## Non-Goals

- Do not rewrite examples into full Vitest suites.
- Do not add new example packages, new dependencies, package scripts, lockfiles,
  generated files, UI behavior, browser verification, or production runtime
  changes.
- Do not broaden example coverage into SAP/BTP, auth, CSRF, or benchmark
  scenarios.

## Acceptance Criteria

- [x] The standalone examples contain explicit assertions with clear failure
  messages for the behavior they claim to verify.
- [x] `pnpm.cmd run example:core` fails if a demonstrated core fixture result
  is intentionally made wrong.
- [x] `pnpm.cmd run example:proxy` fails if the proxied fixture response or
  forwarded header assertion is intentionally made wrong.
- [x] Existing package-local verification commands still run the examples
  successfully.

## Verification

Task-local checks:

- `pnpm.cmd run example:core`
- `pnpm.cmd run example:proxy`
- `pnpm.cmd run examples`
- `pnpm.cmd --filter @bc8-odx/core run verify`
- `pnpm.cmd --filter @bc8-odx/proxy run verify`
- `pnpm.cmd run lint`

Checkpoint or broad checks, if required:

- `pnpm.cmd run typecheck`

Setup/data prerequisites:

- Use existing local fixtures only.
- Use `pnpm.cmd`, not `pnpm`, on this Windows machine because PowerShell blocks
  `.ps1` launchers.

If a check is skipped, record why and the residual risk in Handoff Notes.

## Risk Notes

Low risk because this strengthens local examples and package verification
without changing production runtime behavior. Separate review is not required
unless the implementation changes package scripts, runtime code, dependencies,
lockfiles, or fixture contracts used by production tests.

## Handoff Notes

Completed 2026-05-08 by Codex.

- changed files:
  - `examples/core-standalone.ts`
  - `examples/proxy-standalone.ts`
  - `.agents/tasks/done/075-make-standalone-examples-assertion-backed.md`
  - `.agents/NEXT.md`
- summary:
  - Added `node:assert/strict` checks to the core standalone example for EDMX
    version detection, entity extraction, query stringification, V2 response
    flattening, and `$odata` path/method/query/flattened-response behavior.
  - Added `node:assert/strict` checks to the proxy standalone example for the
    proxied Products fixture response and forwarded custom header behavior.
  - Kept the examples as lightweight scripts run through existing commands; no
    test runner, package scripts, dependencies, lockfiles, fixtures, generated
    files, UI code, or runtime behavior were changed.
- red-check demonstration:
  - PASS: intentionally changed the core expected first item title to
    `Intentionally Wrong Item`; `pnpm.cmd run example:core` failed with
    `AssertionError [ERR_ASSERTION]: Expected flattened first item to match the
    fixture`; reverted the intentional edit.
  - PASS: intentionally changed the proxy expected product name to
    `Intentionally Wrong Product`; `pnpm.cmd run example:proxy` failed with
    `AssertionError [ERR_ASSERTION]: Expected proxied Products response to
    match the backend fixture`; reverted the intentional edit.
- tests run:
  - PASS: `pnpm.cmd run example:core`.
  - PASS: `pnpm.cmd run example:proxy`.
  - PASS: `pnpm.cmd run examples`.
  - PASS: `pnpm.cmd --filter @bc8-odx/core run verify` (5 files, 28 tests).
  - PASS: `pnpm.cmd --filter @bc8-odx/proxy run verify` (11 files, 160 tests,
    1 skipped).
  - PASS: `pnpm.cmd run lint`.
  - PASS: `pnpm.cmd run typecheck`.
- skipped checks and residual risk:
  - None. The first sandboxed example attempts failed with `spawn EPERM` from
    `tsx`/`esbuild`; final verification was rerun with approved elevated
    process-spawn permissions.
- self-check result:
  - Scope stayed limited to task 075 examples and `.agents` workflow state.
  - Assertions cover the demonstrated behavior without converting examples to
    Vitest suites or broadening coverage into SAP/BTP, auth, CSRF, benchmarks,
    browser/UI behavior, runtime code, scripts, dependencies, lockfiles, or
    generated files.
  - No unrelated worktree changes were modified.
- review requirement decision:
  - Separate review is not required. This remains a low-risk example assertion
    change with passing task-local and broad verification, and it does not
    touch production runtime behavior or package contracts.
- task state movement:
  - Moved from `.agents/tasks/ready/` to `.agents/tasks/in-progress/` at start.
  - Moved from `.agents/tasks/in-progress/` to `.agents/tasks/done/` after
    implementation and verification passed.
- `.agents/NEXT.md` update:
  - Updated to start an Orchestrator chat for the next ready task,
    `.agents/tasks/ready/076-skip-buffered-response-flattening-when-devtools-disabled.md`.
- commit hash:
  - Pending at handoff update time.
- known gaps:
  - None.
