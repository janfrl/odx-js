# Task: Harden type generation process execution

Status: ready
Owner: unassigned
Created: 2026-05-04
Risk: high
Review: required

## Objective

Verify whether type generation command construction is brittle, then harden it
only if a focused test demonstrates the problem.

## Context

`packages/nuxt/src/generate.ts` builds a shell command string from metadata and
output paths, then runs it with `execSync`. Paths can contain spaces and shell
significant characters. This is a suspected robustness issue, not yet a proven
bug.

Relevant files:

- `packages/nuxt/src/generate.ts`
- `packages/nuxt/test/generate.test.ts`
- `ARCHITECTURE.md`
- `DEPLOYMENT.md`

## Scope

- First write a focused test around process invocation behavior. It should fail
  against the current implementation if the suspected bug is real.
- Replace shell-string execution with an argument-array process call such as
  `execFileSync`, `spawnSync`, or a local helper that avoids shell
  interpretation only after the test proves the issue.
- Preserve the current `odata2ts` options and error reporting.
- Add focused tests around the process invocation helper if practical.
- Keep metadata download and registry generation behavior unchanged.

## Non-Goals

- Do not replace `odata2ts`.
- Do not redesign the type generation pipeline.
- Do not change generated registry augmentation.
- Do not add dependencies.

## Acceptance Criteria

- [ ] The first implementation step verifies the bug with a failing test or
      records that no bug was reproduced.
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

High risk if implementation changes process execution or setup/build behavior.
Separate review is required for an implementation fix. If no bug is reproduced
and no implementation changes are made, this can close as an audit without
separate review.

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
