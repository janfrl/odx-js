# Task: Harden type generation process execution

Status: ready
Owner: unassigned
Created: 2026-05-04
Risk: high
Review: required

## Objective

Run `odata2ts` during type generation without shell-string command
construction.

## Context

`packages/nuxt/src/generate.ts` builds a shell command string from metadata and
output paths, then runs it with `execSync`. Paths can contain spaces and should
not be interpreted by a shell. Type generation is part of setup and CI, and the
current implementation is brittle on Windows paths.

Relevant files:

- `packages/nuxt/src/generate.ts`
- `packages/nuxt/test/generate.test.ts`
- `ARCHITECTURE.md`
- `DEPLOYMENT.md`

## Scope

- Replace shell-string execution with an argument-array process call such as
  `execFileSync`, `spawnSync`, or a local helper that avoids shell
  interpretation.
- Preserve the current `odata2ts` options and error reporting.
- Add focused tests around the process invocation helper if practical.
- Keep metadata download and registry generation behavior unchanged.

## Non-Goals

- Do not replace `odata2ts`.
- Do not redesign the type generation pipeline.
- Do not change generated registry augmentation.
- Do not add dependencies.

## Acceptance Criteria

- [ ] Process execution passes source and output paths as discrete arguments.
- [ ] Paths containing spaces are handled by construction, not by manual shell
      quoting.
- [ ] Existing generation tests still pass.
- [ ] Error output remains useful when `odata2ts` fails.
- [ ] Registry augmentation output remains unchanged.

## Verification

Task-local checks:

- `pnpm.cmd run test -- packages/nuxt/test/generate.test.ts`
- `pnpm.cmd run typecheck`

Checkpoint or broad checks, if required:

- `pnpm.cmd run test -- packages/nuxt`
- `pnpm.cmd run lint`

Setup/data prerequisites:

- Use `pnpm.cmd`, not `pnpm`, on this Windows machine because PowerShell blocks
  `.ps1` launchers.

If a check is skipped, record why and the residual risk in Handoff Notes.

## Risk Notes

High risk because this touches command execution and setup/build behavior.
Separate review is required under `.agents/WORKFLOW.md`.

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
