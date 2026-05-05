# Task: Add docs package README verification notes

Status: done
Owner: Codex orchestrator
Created: 2026-05-05
Risk: low
Review: not required

## Objective

Add a concise docs package README that explains the package-local verification
command and its no-dev-server expectation.

## Context

Task 029 added `pnpm.cmd --filter docs run verify`, and the root README lists
the command. Unlike core, proxy, Nuxt, and Explorer, the `docs` workspace has no
package README describing its verification surface. A short README improves
documentation clarity without changing docs content or build behavior.

Relevant docs and files:

- `README.md`
- `CONTRIBUTING.md`
- `docs/package.json`
- `docs/`
- `.agents/tasks/done/029-add-docs-package-verify-script.md`

## Scope

- Add `docs/README.md` with:
  - package purpose
  - package-local verification command
  - a note that verify runs metadata/API extraction and does not start a dev
    server
  - Windows `pnpm.cmd` launcher note consistent with package READMEs
- Link to root documentation or docs content where appropriate.
- Update the root README only if adding the docs README reveals inaccurate
  wording.

## Non-Goals

- Do not redesign docs content, navigation, landing pages, or generated API
  reference output.
- Do not change docs scripts.
- Do not run or require a browser/dev server.
- Do not add dependencies or generated artifacts.

## Acceptance Criteria

- [ ] `docs/README.md` exists and describes the docs package purpose.
- [ ] The README lists `pnpm.cmd --filter docs run verify`.
- [ ] The README states that package verification does not start a dev server.
- [ ] Existing root README verification guidance remains accurate.
- [ ] No generated docs artifacts are committed.

## Verification

Task-local checks:

- `pnpm.cmd --filter docs run verify`
- `git diff --check`

Checkpoint or broad checks, if required:

- `pnpm.cmd run lint`

Setup/data prerequisites:

- Use existing local docs scripts only.
- Use `pnpm.cmd`, not `pnpm`, on this Windows machine because PowerShell blocks
  `.ps1` launchers.

If a check is skipped, record why and the residual risk in Handoff Notes.

## Risk Notes

Low risk because this is documentation-only package clarity work. Separate
review is not required unless implementation changes docs scripts, generated
content, or package behavior.

## Handoff Notes

- changed files:
  - `docs/README.md`
- summary:
  - Added a concise docs package README describing the docs workspace purpose,
    package-local verification command, no-dev-server expectation, and Windows
    `pnpm.cmd` launcher note.
- tests run:
  - `pnpm.cmd --filter docs run verify` - passed.
  - `git diff --check` - passed.
- skipped checks and residual risk:
  - `pnpm.cmd run lint` skipped because this is README-only documentation and
    task-local verification passed. Residual risk is low.
- self-check result:
  - Scope is documentation-only. No docs scripts, generated docs content,
    dependencies, navigation, or site behavior changed.
- review requirement decision:
  - Separate review is not required because this is documentation-only package
    clarity work.
- task state movement:
  - Move this task to `.agents/tasks/done/`.
- `.agents/NEXT.md` update:
  - No change while high-risk task 032 review remains the active workflow gate.
- commit hash:
  - pending commit.
- known gaps:
  - none.
