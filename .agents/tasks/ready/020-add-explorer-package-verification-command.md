# Task: Add Explorer package verification command

Status: ready
Owner: unassigned
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
