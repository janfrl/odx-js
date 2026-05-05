# Task: Add docs package verify script

Status: ready
Owner: unassigned
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
