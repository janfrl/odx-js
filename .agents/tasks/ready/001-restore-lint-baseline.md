# Task: Restore lint baseline

Status: ready
Owner: unassigned
Created: 2026-05-04
Risk: low
Review: not required

## Objective

Make `pnpm.cmd run lint` pass without changing runtime behavior.

## Context

The orchestration analysis on 2026-05-04 found that tests and typecheck pass,
but lint fails. Most failures come from Markdown examples in
`.agents/skills/nuxt-ui/**`; remaining failures are macro ordering and script
block spacing in docs Vue components.

Relevant files:

- `eslint.config.mjs`
- `.agents/skills/nuxt-ui/**`
- `docs/components/content/LandingHero.vue`
- `docs/components/content/LandingLiveDemo.vue`

## Scope

- Decide whether `.agents/skills/nuxt-ui/**` should be ignored by lint or made
  lint-compatible.
- Fix the docs Vue lint errors without changing component behavior.
- Keep the change limited to lint configuration and lint-only source ordering or
  formatting fixes.

## Non-Goals

- Do not redesign docs pages.
- Do not change Nuxt UI skill content beyond what is needed for lint hygiene.
- Do not add dependencies.
- Do not address runtime proxy, generation, or composable bugs.

## Acceptance Criteria

- [ ] `pnpm.cmd run lint` passes.
- [ ] `pnpm.cmd run typecheck` still passes.
- [ ] Any ignore rule added to `eslint.config.mjs` is narrowly justified by the
      file class it excludes.
- [ ] No unrelated source files are changed.

## Verification

Task-local checks:

- `pnpm.cmd run lint`
- `pnpm.cmd run typecheck`

Checkpoint or broad checks, if required:

- `pnpm.cmd run test` if implementation changes more than lint-only ordering or
  config.

Setup/data prerequisites:

- Use `pnpm.cmd`, not `pnpm`, on this Windows machine because PowerShell blocks
  `.ps1` launchers.

If a check is skipped, record why and the residual risk in Handoff Notes.

## Risk Notes

Low risk. This is a tooling and formatting baseline task. Separate review is
not required unless the implementer changes production behavior or broadens the
lint configuration beyond operational skill/reference files.

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
