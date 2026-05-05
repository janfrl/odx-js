# Task: Finish agent workflow adoption

Status: done
Owner: Codex
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

- changed files: `AGENTS.md`, `.agents/README.md`, `.agents/ROADMAP.md`,
  `.agents/NEXT.md`, deleted `.agents/ADOPTION.md`, and this task file
- summary: removed template-adoption references, deleted the adoption playbook,
  and updated roadmap language to current ODX quality, package-confidence, and
  product-confidence work
- tests run: `git diff --check`, `git status --short --branch`
- skipped checks and residual risk: package checks skipped because this is
  operational documentation only
- self-check result: scope, acceptance criteria, documentation boundaries, and
  unrelated changes checked
- review requirement decision: separate review not required; low-risk
  operational documentation cleanup
- task state movement: move from `.agents/tasks/ready/` to
  `.agents/tasks/done/`
- `.agents/NEXT.md` update: point to
  `.agents/tasks/ready/007-add-proxy-performance-benchmarks.md`
- commit hash: pending commit at handoff-note update time
- known gaps: none
