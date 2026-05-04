# Task: Finish agent workflow adoption

Status: ready
Owner: unassigned
Created: 2026-05-04
Risk: low
Review: not required

## Objective

Move `.agents/` from template adoption mode to normal project workflow mode.

## Context

The repository now has project-specific root documentation and ready task
briefs. `.agents/ADOPTION.md` still describes template adoption, and
`.agents/NEXT.md` previously pointed at an adoption-style orchestrator prompt.
After the first implementation tasks are stable, the operational workflow
should stop carrying adoption-only guidance.

Relevant files:

- `AGENTS.md`
- `.agents/ADOPTION.md`
- `.agents/NEXT.md`
- `.agents/ROADMAP.md`
- `.agents/EPICS.md`
- `.agents/BACKLOG.md`

## Scope

- Remove or retire adoption-only references when they are no longer useful.
- Ensure `.agents/NEXT.md` points to the next concrete task or review step.
- Update roadmap/backlog language so it reflects the ODX repository, not a
  generic template.
- Keep durable project rules in root docs, not only in `.agents/`.

## Non-Goals

- Do not rewrite root product, API, architecture, security, or deployment docs
  unless an adoption-only reference remains there.
- Do not create new task categories or assistant-specific folders.
- Do not delete useful project-specific planning state.

## Acceptance Criteria

- [ ] `.agents/NEXT.md` has one concrete next action and a copyable prompt.
- [ ] Adoption-only placeholders are removed or explicitly justified.
- [ ] Roadmap/backlog language describes current ODX work.
- [ ] Root documentation remains the source for durable project guidance.

## Verification

Task-local checks:

- `git diff --check`
- `git status --short --branch`

Checkpoint or broad checks, if required:

- `pnpm.cmd run lint` if Markdown or Vue examples are edited after task 001.

Setup/data prerequisites:

- none

If a check is skipped, record why and the residual risk in Handoff Notes.

## Risk Notes

Low risk. This is operational documentation cleanup. Separate review is not
required unless durable project rules are materially changed.

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
