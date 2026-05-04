# Task: Restore lint baseline

Status: done
Owner: Codex
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

- changed files: `eslint.config.mjs`,
  `docs/components/content/LandingHero.vue`,
  `docs/components/content/LandingLiveDemo.vue`,
  `.agents/NEXT.md`, and this task file
- summary: ignored operational `.agents/skills/**` reference material from
  source lint and fixed docs Vue macro-order/spacing issues without behavior
  changes
- tests run: `pnpm.cmd run lint`, `pnpm.cmd run typecheck`
- skipped checks and residual risk: full tests skipped because the change is
  lint configuration and script ordering only
- self-check result: scope, acceptance criteria, docs boundaries, and unrelated
  changes checked
- review requirement decision: separate review not required; low-risk lint
  baseline task with no runtime behavior change
- task state movement: move from `.agents/tasks/ready/` to
  `.agents/tasks/done/`
- `.agents/NEXT.md` update: point to
  `.agents/tasks/ready/002-audit-devtools-log-data-exposure.md`
- commit hash: pending commit at handoff-note update time
- known gaps: none
