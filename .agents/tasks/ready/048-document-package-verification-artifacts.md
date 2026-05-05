# Task: Document package verification artifacts

Status: ready
Owner: unassigned
Created: 2026-05-05
Risk: low
Review: not required

## Objective

Clarify package verification documentation around the root aggregate command
and docs-generated artifacts.

## Context

Task 044 added `pnpm.cmd run verify:packages`, which runs package-local verify
scripts for core, proxy, Nuxt, Explorer, and docs. Its handoff noted that the
docs verify step runs API extraction and can rewrite generated docs artifacts
if API reference output is stale. Contributors should be able to distinguish
package verification, broad workspace checks, and artifact drift.

Relevant docs and files:

- `README.md`
- `docs/README.md`
- `packages/core/README.md`
- `packages/proxy/README.md`
- `packages/nuxt/README.md`
- `packages/explorer/README.md`
- `package.json`
- `.agents/tasks/done/044-add-aggregate-package-verification-script.md`

## Scope

- Update documentation only where it improves discoverability of:
  - `pnpm.cmd run verify:packages`.
  - package-local verify commands.
  - the fact that docs verification may surface generated API reference drift.
- Keep wording concise and close to existing package verification sections.
- Mention that `verify:packages` does not replace broad `lint`, `typecheck`,
  or workspace `test`.

## Non-Goals

- Do not change scripts, source code, generated docs artifacts, package
  behavior, examples, dependencies, lockfiles, or CI configuration.
- Do not start a docs redesign or reorganize package READMEs.
- Do not run the docs dev server or browser checks.

## Acceptance Criteria

- [ ] Root README package verification guidance clearly states when to use
  `verify:packages`.
- [ ] Docs README mentions that verification can expose generated API reference
  drift without starting the dev server.
- [ ] Package README guidance remains concise and consistent.
- [ ] No code, script, lockfile, or generated artifact changes are included.

## Verification

Task-local checks:

- Inspect the changed Markdown for command accuracy and consistency.
- `pnpm.cmd run verify:packages` only if documentation wording changes command
  behavior expectations; otherwise skip with residual risk noted.

Checkpoint or broad checks, if required:

- `pnpm.cmd run lint` only if non-Markdown files change.

Setup/data prerequisites:

- Use `pnpm.cmd`, not `pnpm`, on this Windows machine because PowerShell blocks
  `.ps1` launchers.

If a check is skipped, record why and the residual risk in Handoff Notes.

## Risk Notes

Low risk because this is documentation-only package isolation guidance.
Separate review is not required unless scripts, CI, generated artifacts, or
package behavior change.

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
