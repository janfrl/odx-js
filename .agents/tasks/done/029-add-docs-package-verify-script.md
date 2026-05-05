# Task: Add docs package verify script

Status: done
Owner: Codex worker
Created: 2026-05-05
Risk: low
Review: not required

## Objective

Make the documentation package locally verifiable through a package-local
`verify` script that checks metadata/API extraction without starting a dev
server.

## Context

Task 023 added package-local verify scripts for core, proxy, Nuxt, and Explorer.
The `docs` workspace package still exposes build/dev scripts but no focused
verification command. A small docs verify command improves package isolation
and keeps documentation automation discoverable.

Relevant docs and files:

- `README.md`
- `docs/package.json`
- `scripts/extract-api-docs.ts`
- `docs/scripts/extract-metadata.ts`
- `test/api-extractor.test.ts`
- `.agents/tasks/done/023-add-package-local-verify-scripts.md`

## Scope

- Add a package-local `verify` script to `docs/package.json`.
- Prefer existing checks such as metadata extraction and API extractor tests;
  keep the command lightweight and non-server.
- Update the root README package verification table to mention the docs verify
  command.
- Add a short docs package README only if there is no better existing
  documentation location for the command.
- Preserve existing `docs`, `docs:api`, `docs:prepare`, and docs package dev
  scripts.

## Non-Goals

- Do not redesign docs content or navigation.
- Do not build the full docs site unless the chosen verify command truly needs
  it.
- Do not start a dev server or require browser verification.
- Do not add dependencies.

## Acceptance Criteria

- [ ] `docs` has a package-local `verify` command.
- [ ] The verify command checks docs metadata/API extraction with existing local
  tooling or tests.
- [ ] Root documentation lists the docs verify command.
- [ ] Existing docs scripts remain valid.
- [ ] No generated docs artifacts are committed unless already tracked and
  intentionally updated.

## Verification

Task-local checks:

- `pnpm.cmd --filter docs run verify`
- `pnpm.cmd run docs:api`
- `pnpm.cmd run lint`

Checkpoint or broad checks, if required:

- `pnpm.cmd run typecheck`

Setup/data prerequisites:

- Use existing local docs scripts and fixtures only.
- Use `pnpm.cmd`, not `pnpm`, on this Windows machine because PowerShell blocks
  `.ps1` launchers.

If a check is skipped, record why and the residual risk in Handoff Notes.

## Risk Notes

Low risk because this is package-local script and documentation work. Separate
review is not required unless generated public docs content changes in a way
that affects user-facing API documentation.

## Handoff Notes

Completed 2026-05-05 by Codex worker.

- changed files:
  - `docs/package.json`
  - `README.md`
  - `scripts/extract-api-docs.ts`
  - `.agents/tasks/done/029-add-docs-package-verify-script.md`
  - `.agents/NEXT.md`
- summary:
  - Added a docs package-local `verify` script.
  - The command runs docs metadata extraction and root API reference extraction
    without starting a dev server.
  - Updated the root README package verification table with the docs verify
    command.
  - Updated API reference extraction to write a trailing newline so the
    generated tracked JSON remains lint-clean after `docs:api`.
- tests run:
  - PASS: `pnpm.cmd --filter docs run verify`.
  - PASS: `pnpm.cmd run docs:api`.
  - PASS: `pnpm.cmd run lint`.
- skipped checks and residual risk:
  - `pnpm.cmd run typecheck` was not run because this is a low-risk docs
    script/documentation change and task-local checks passed.
- self-check result:
  - Scope stayed limited to docs verification and documentation automation.
  - No dev server, dependencies, docs content redesign, or runtime package code
    changes were added.
  - Existing unrelated proxy benchmark documentation/test edits were left
    untouched.
- review requirement decision:
  - Separate review is not required because this is low-risk package script and
    documentation automation work.
- task state movement:
  - Moved to `.agents/tasks/done/`.
- `.agents/NEXT.md` update:
  - Updated to task 030.
- commit hash:
  - Pending at handoff update time; final response will report the created
    commit hash if commit succeeds.
- known gaps:
  - Running `docs:api` in this workspace can refresh generated API content from
    unrelated uncommitted package changes; those generated content changes were
    not included in this task.
