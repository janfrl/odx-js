# Task: Add package-local verify scripts

Status: done
Owner: Codex orchestrator
Created: 2026-05-05
Risk: low
Review: not required

## Objective

Make package-level verification more discoverable by adding local `verify`
scripts for packages that currently rely on root-only commands.

## Context

Tasks 010, 011, 016, and 020 added framework-free examples, a minimal Nuxt
playground check, Explorer verification, and root README documentation. The
root commands are useful, but package-local `verify` scripts make each package
easier to validate through `pnpm.cmd --filter <package> run verify`.

Relevant docs:

- `README.md`
- `packages/core/README.md`
- `packages/proxy/README.md`
- `packages/nuxt/README.md`
- `packages/explorer/README.md`
- `.agents/PACKAGE_ISOLATION.md`

## Scope

- Add `verify` scripts where missing for `@bc8-odx/core`, `@bc8-odx/proxy`,
  and `@bc8-odx/nuxt`.
- Prefer commands that reuse existing focused tests, examples, or playground
  checks without broadening runtime behavior.
- Update package READMEs and the root package verification table so the
  package-local commands are discoverable.
- Preserve existing root scripts such as `example:core`, `example:proxy`,
  `examples`, `bench:proxy`, and Nuxt `playground:check`.

## Non-Goals

- Do not add new tests, examples, playgrounds, or dependencies.
- Do not change package runtime code.
- Do not remove existing root verification commands.
- Do not add browser or visual verification infrastructure.

## Acceptance Criteria

- [ ] `@bc8-odx/core` has a package-local `verify` command.
- [ ] `@bc8-odx/proxy` has a package-local `verify` command.
- [ ] `@bc8-odx/nuxt` has a package-local `verify` command.
- [ ] Root and package README verification sections mention the package-local
  commands.
- [ ] Existing root verification commands remain valid.

## Verification

Task-local checks:

- `pnpm.cmd --filter @bc8-odx/core run verify`
- `pnpm.cmd --filter @bc8-odx/proxy run verify`
- `pnpm.cmd --filter @bc8-odx/nuxt run verify`
- `pnpm.cmd run lint`

Checkpoint or broad checks, if required:

- `pnpm.cmd run typecheck`

Setup/data prerequisites:

- Use existing local tests, examples, and playground fixtures.
- Use `pnpm.cmd`, not `pnpm`, on this Windows machine because PowerShell blocks
  `.ps1` launchers.

If a check is skipped, record why and the residual risk in Handoff Notes.

## Risk Notes

Low risk because this is package script and documentation work only. Separate
review is not required unless the implementation changes runtime code,
dependency wiring, or broad workspace scripts beyond the stated scope.

## Handoff Notes

Completed 2026-05-05 by Orchestrator.

- changed files:
  - `packages/core/package.json`
  - `packages/proxy/package.json`
  - `packages/nuxt/package.json`
  - `packages/core/README.md`
  - `packages/proxy/README.md`
  - `packages/nuxt/README.md`
  - `README.md`
- summary:
  - Added package-local `verify` scripts for core, proxy, and Nuxt.
  - Core verify runs the existing standalone core fixture example.
  - Proxy verify runs the proxy Vitest suite plus the existing standalone proxy
    fixture example.
  - Nuxt verify runs the existing generation/module e2e tests plus the minimal
    playground check.
  - Updated package READMEs and the root package verification table.
- tests run:
  - PASS: `pnpm.cmd --filter @bc8-odx/core run verify`.
  - PASS: `pnpm.cmd --filter @bc8-odx/proxy run verify`.
  - PASS: `pnpm.cmd --filter @bc8-odx/nuxt run verify`.
  - PASS: `pnpm.cmd run lint`.
- skipped checks and residual risk:
  - `pnpm.cmd run typecheck` was not rerun for this script/docs-only task; it
    passed earlier in the same checkpoint after task 022/021 changes.
  - Nuxt verify intentionally targets package-local e2e/playground checks,
    because `test/composables.test.ts` depends on root workspace aliases.
- self-check result:
  - Scope stayed limited to package scripts and documentation.
  - No runtime code, dependencies, root command removals, or browser/visual
    infrastructure were added.
- review requirement decision:
  - Separate review is not required because this is low-risk script/docs work.
- task state movement:
  - Moved to `.agents/tasks/done/` by Orchestrator.
- `.agents/NEXT.md` update:
  - Updated to task 024.
- commit hash:
  - Pending at handoff update time.
- known gaps:
  - None.
