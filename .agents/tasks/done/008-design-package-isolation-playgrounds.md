# Task: Design package isolation playgrounds

Status: done
Owner: Codex
Created: 2026-05-05
Risk: medium
Review: not required for planning, required if implementation changes package
contracts

## Objective

Plan how to demonstrate and verify each package independently, so the monorepo
does not feel like one coupled application that only works as a whole.

## Context

The repository is split into `core`, `proxy`, `nuxt`, `explorer`, and
deployment-oriented packages. The operator wants clearer proof that individual
packages work independently, potentially through separate playgrounds,
examples, or focused verification commands.

Relevant files:

- `ARCHITECTURE.md`
- `README.md`
- `packages/core/README.md`
- `packages/proxy/README.md`
- `packages/nuxt/README.md`
- `packages/explorer/README.md`
- `playground/`
- `package.json`
- `pnpm-workspace.yaml`

## Scope

- Audit existing package-level READMEs, tests, and scripts.
- Propose a small implementation sequence for independent package verification.
- Identify whether separate playgrounds, examples, package scripts, or docs are
  the best fit for each package.
- Keep the output concrete enough to become implementation tasks.

## Non-Goals

- Do not build all playgrounds in this task.
- Do not change package public APIs.
- Do not add dependencies.
- Do not rewrite user-facing documentation broadly.

## Acceptance Criteria

- [ ] Each package has a proposed independent verification story.
- [ ] The plan distinguishes tests, examples, playgrounds, and docs.
- [ ] The plan identifies the first 2-3 implementation tasks.
- [ ] Any unclear product or maintenance tradeoff is called out explicitly.

## Verification

Task-local checks:

- `git diff --check`

Checkpoint or broad checks, if required:

- none for planning-only changes

Setup/data prerequisites:

- none

If a check is skipped, record why and the residual risk in Handoff Notes.

## Risk Notes

Medium risk if this leads to new package boundaries or scripts, but this task
itself is planning-only. Separate review is not required unless package
contracts are changed.

## Handoff Notes

- changed files: `.agents/PACKAGE_ISOLATION.md`,
  `.agents/tasks/ready/010-add-core-proxy-standalone-examples.md`,
  `.agents/tasks/ready/011-add-minimal-nuxt-package-playground.md`,
  `.agents/tasks/ready/012-expand-explorer-state-tests.md`, and this task file
- summary: audited package-level verification surfaces, chose examples/tests
  over broad playground work, and created three concrete implementation tasks
- tests run: `git diff --check`
- skipped checks and residual risk: package checks skipped because this is
  planning-only
- self-check result: scope, acceptance criteria, maintenance tradeoffs, and
  unrelated changes checked
- review requirement decision: separate review not required; no package
  contracts changed
- task state movement: move from `.agents/tasks/ready/` to
  `.agents/tasks/done/`
- `.agents/NEXT.md` update: not changed; task 007 remains the active
  implementation task
- commit hash: pending commit at handoff-note update time
- known gaps: package-isolation examples are planned but not implemented
