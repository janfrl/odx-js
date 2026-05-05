# Task: Document generated metadata cache cleanup

Status: done
Owner: Codex
Created: 2026-05-05
Risk: low
Review: not required

## Objective

Clarify where generated metadata cache files live and how contributors should
clean them during local troubleshooting.

## Context

The deployment docs already describe `.nuxt/odx/temp/<service>.edmx` and
`.odx/cache/<service>.edmx`, and the backlog still calls out generated
metadata cache policy and cleanup expectations as a later follow-up. A small
documentation pass can make the current policy explicit without changing cache
behavior.

Relevant docs and files:

- `README.md`
- `CONTRIBUTING.md`
- `DEPLOYMENT.md`
- `docs/content/en/1.ecosystem/4.troubleshooting.md`
- `docs/content/en/2.nuxt/1.getting-started.md`
- `docs/content/en/2.nuxt/4.deployment.md`
- matching German docs only if nearby existing content already mirrors the
  changed English section closely
- `.agents/BACKLOG.md`

## Scope

- Update the smallest existing documentation sections needed to explain:
  - `.nuxt/odx/temp/` is generated Nuxt runtime/build state.
  - `.odx/cache/` is a persistent local metadata fallback cache.
  - neither directory should be committed unless a future release explicitly
    changes that policy.
  - when it is reasonable to delete one or both during local troubleshooting.
- Keep wording concise and aligned with existing deployment/troubleshooting
  language.
- Update `.agents/BACKLOG.md` to remove or narrow the generated metadata cache
  cleanup follow-up after documenting it.

## Non-Goals

- Do not change cache implementation, generated file paths, generation
  behavior, cleanup scripts, package scripts, dependencies, lockfiles, or CI.
- Do not add a new documentation page.
- Do not rewrite broad deployment or troubleshooting docs.
- Do not run dev servers or browser verification.

## Acceptance Criteria

- [x] Documentation identifies both generated metadata cache locations and
  their purpose.
- [x] Documentation tells contributors not to commit those generated cache
  directories.
- [x] Documentation gives a bounded cleanup recommendation for stale local
  metadata troubleshooting.
- [x] `.agents/BACKLOG.md` no longer carries the same unresolved cleanup item
  without qualification.
- [x] No source, script, dependency, lockfile, or generated artifact changes
  are included.

## Verification

Task-local checks:

- Inspect changed Markdown for path accuracy, command accuracy, and consistency
  with `DEPLOYMENT.md`.
- `git diff --check`

Checkpoint or broad checks, if required:

- `pnpm.cmd run lint` only if non-Markdown files change.

Setup/data prerequisites:

- none

If a check is skipped, record why and the residual risk in Handoff Notes.

## Risk Notes

Low risk because this is documentation-only cleanup guidance. Separate review
is not required unless scripts, source, generated artifacts, dependencies,
lockfiles, or cache behavior change.

## Handoff Notes

- changed files
  - `DEPLOYMENT.md`
  - `docs/content/en/1.ecosystem/4.troubleshooting.md`
  - `docs/content/en/2.nuxt/1.getting-started.md`
  - `.agents/BACKLOG.md`
  - `.agents/tasks/done/053-document-generated-metadata-cache-cleanup.md`
  - `.agents/NEXT.md`
- summary
  - Clarified that `.nuxt/odx/temp/` is generated Nuxt runtime/build state.
  - Clarified that `.odx/cache/<service>.edmx` is a persistent local metadata
    fallback cache.
  - Documented that both locations are generated local artifacts and should
    not be committed unless policy changes.
  - Added bounded stale-metadata cleanup guidance: clear `.nuxt/odx/temp/`
    first, and delete the matching `.odx/cache/<service>.edmx` only when a
    forced refetch is wanted.
  - Narrowed `.agents/BACKLOG.md` now that the cleanup guidance is documented.
- tests run
  - Manual Markdown inspection for path accuracy and consistency with
    `DEPLOYMENT.md`.
  - PASS: `git diff --check`
- skipped checks and residual risk
  - `pnpm.cmd run lint` was skipped because only Markdown and `.agents`
    workflow files changed.
  - German docs were not changed; the task allowed matching German updates only
    when nearby content clearly mirrored the edited English section. The
    highest-signal cleanup guidance now lives in root `DEPLOYMENT.md` and
    English docs.
- self-check result
  - Scope stayed documentation-only. No cache implementation, generated paths,
    generation behavior, cleanup scripts, package scripts, dependencies,
    lockfiles, CI, generated artifacts, dev servers, or browser verification
    were touched.
- review requirement decision
  - Separate review is not required because this is low-risk documentation-only
    guidance.
- task state movement
  - Moved from `.agents/tasks/ready/` to `.agents/tasks/done/`.
- `.agents/NEXT.md` update
  - Updated to run the Planner because the ready queue is empty.
- commit hash
  - The task implementation commit is the commit containing this handoff.
- known gaps
  - None.
