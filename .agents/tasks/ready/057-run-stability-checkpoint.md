# Task: Run stability checkpoint

Status: ready
Owner: unassigned
Created: 2026-05-05
Risk: low
Review: not required

## Objective

Run and record a checkpoint after tasks 054-056 complete so the next planner or
orchestrator starts from known verification state.

## Context

Tasks 054-056 cover benchmark configuration validation, Nuxt metadata download
client selection, and core OData flattening. After those complete, a small
checkpoint should verify package-level and workspace confidence before
planning broader optimization, package isolation, or Explorer work.

Relevant docs and files:

- `AGENTS.md`
- `CONTRIBUTING.md`
- `.agents/WORKFLOW.md`
- `.agents/NEXT.md`
- `.agents/tasks/ready/`
- `.agents/tasks/done/`
- `.agents/reviews/`

## Scope

- Run the checkpoint commands listed below after tasks 054-056 are complete.
- Confirm task states are consistent and `.agents/NEXT.md` points to the next
  concrete action.
- Record checkpoint results in this task's handoff notes.
- If checks pass and no ready tasks remain, update `.agents/NEXT.md` to the
  Planner prompt for creating the next 3-5 tasks.
- If a check fails, stop with the failure details and update `.agents/NEXT.md`
  to a focused fix or review prompt only when the fix is bounded.

## Non-Goals

- Do not implement unrelated fixes while running the checkpoint.
- Do not change production source, tests, scripts, dependencies, lockfiles, or
  documentation unless a bounded checkpoint-state note is required.
- Do not open browser-mode verification unless a preceding task introduced
  visible UI behavior that explicitly requires it.
- Do not delete generated artifacts or revert edits made by others.

## Acceptance Criteria

- [ ] Package-local aggregate verification is run or a blocker is recorded.
- [ ] Workspace tests are run or a blocker is recorded.
- [ ] Typecheck is run or a blocker is recorded.
- [ ] Lint is run or a blocker is recorded.
- [ ] Task states and `.agents/NEXT.md` are consistent at the end.
- [ ] Any failures, skipped checks, and residual risks are recorded clearly.

## Verification

Task-local checks:

- `pnpm.cmd run verify:packages`
- `pnpm.cmd run test`
- `pnpm.cmd run typecheck`
- `pnpm.cmd run lint`
- `git status --short`

Checkpoint or broad checks, if required:

- none beyond the task-local checkpoint commands

Setup/data prerequisites:

- Run after tasks 054-056 are complete unless the operator explicitly asks for
  an earlier checkpoint.
- Use `pnpm.cmd`, not `pnpm`, on this Windows machine because PowerShell blocks
  `.ps1` launchers.

If a check is skipped, record why and the residual risk in Handoff Notes.

## Risk Notes

Low risk because this is verification and workflow-state recording only.
Separate review is not required unless the checkpoint uncovers broad failures
that require code changes or a risky decision.

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

