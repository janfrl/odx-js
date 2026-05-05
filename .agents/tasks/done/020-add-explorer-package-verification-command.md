# Task: Add Explorer package verification command

Status: done
Owner: Codex orchestrator
Created: 2026-05-05
Risk: low
Review: optional

## Objective

Give `@bc8-odx/explorer` a documented package-level verification command that
checks Explorer tests without relying on the full workspace test run.

## Context

Recent package-confidence work added standalone core/proxy examples, a Nuxt
minimal playground check, and README documentation for those commands. Explorer
has focused tests but no equally discoverable package verification command in
its package scripts or README.

Relevant docs:

- `README.md`
- `packages/explorer/README.md`
- `.agents/tasks/done/008-design-package-isolation-playgrounds.md`
- `.agents/tasks/done/016-document-package-verification-commands.md`

## Scope

- Add a package-local verification script to `packages/explorer/package.json`
  if one does not already exist.
- Prefer a command that runs existing Explorer Vitest coverage only.
- Document the command in `packages/explorer/README.md`.
- Add a concise root README row only if the root package verification table
  should include Explorer for symmetry.
- Use existing tooling; do not add dependencies.

## Non-Goals

- Do not add browser or visual regression infrastructure.
- Do not redesign Explorer tests.
- Do not change Explorer runtime behavior.
- Do not touch proxy, Nuxt, or core code.

## Acceptance Criteria

- [ ] Explorer has a package-level verification command.
- [ ] The command is documented where humans can find it.
- [ ] The command runs with `pnpm.cmd --filter @bc8-odx/explorer ...`.
- [ ] Existing Explorer tests pass through the new command.
- [ ] No new dependencies are added.

## Verification

Task-local checks:

- `pnpm.cmd --filter @bc8-odx/explorer run <new-script-name>`
- `pnpm.cmd run lint`

Checkpoint or broad checks, if required:

- `pnpm.cmd run typecheck`

Setup/data prerequisites:

- Use `pnpm.cmd`, not `pnpm`, on this Windows machine because PowerShell blocks
  `.ps1` launchers.

If a check is skipped, record why and the residual risk in Handoff Notes.

## Risk Notes

Low risk because this should be package script and documentation work only.
Separate review is optional unless the implementation changes runtime code or
workspace package wiring beyond a focused script.

## Handoff Notes

Completed 2026-05-05 by Implementer worker and integrated by Orchestrator.

- changed files:
  - `packages/explorer/package.json`
  - `packages/explorer/README.md`
  - `README.md`
- summary:
  - Added `verify: vitest run` to the Explorer package scripts.
  - Documented `pnpm.cmd --filter @bc8-odx/explorer run verify` in the
    Explorer README.
  - Added the Explorer verification command to the root package verification
    table for symmetry with the other package checks.
- tests run:
  - PASS: `pnpm.cmd --filter @bc8-odx/explorer run verify`.
  - PASS: `pnpm.cmd run lint`.
- skipped checks and residual risk:
  - No task-local checks were skipped.
  - Runtime Explorer filtering changes reported by the worker were split into
    task 018 instead of this low-risk tooling/docs task.
- self-check result:
  - Scope is limited to package script and documentation.
  - No dependencies, runtime behavior, proxy, Nuxt, or core files are included
    in this task commit.
- review requirement decision:
  - Separate review is optional and not required because the integrated task
    contains only script/docs changes.
- task state movement:
  - Moved to `.agents/tasks/done/` by Orchestrator.
- `.agents/NEXT.md` update:
  - Left pointing at task 018 because task 018 is the active next work item.
- commit hash:
  - Pending at handoff update time.
- known gaps:
  - None.
