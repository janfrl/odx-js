# Task: Make standalone examples assertion-backed

Status: ready
Owner: unassigned
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

- [ ] The standalone examples contain explicit assertions with clear failure
  messages for the behavior they claim to verify.
- [ ] `pnpm.cmd run example:core` fails if a demonstrated core fixture result
  is intentionally made wrong.
- [ ] `pnpm.cmd run example:proxy` fails if the proxied fixture response or
  forwarded header assertion is intentionally made wrong.
- [ ] Existing package-local verification commands still run the examples
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
