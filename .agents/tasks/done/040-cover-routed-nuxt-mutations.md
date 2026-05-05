# Task: Cover routed Nuxt mutations

Status: done
Owner: Implementer
Created: 2026-05-05
Completed: 2026-05-05
Risk: low
Review: not required

## Objective

Add focused Nuxt composable tests proving that configured service routes apply
to create, update, and remove calls, not just list calls.

## Context

Existing Nuxt composable tests cover route aliases for proxied list URLs. The
same route alias behavior should be pinned for mutation helpers because those
methods call `$odata` directly and are more likely to matter in application
write flows.

Relevant docs and files:

- `API.md`
- `DOMAIN_MODEL.md`
- `packages/nuxt/src/runtime/composables/useOData.ts`
- `packages/nuxt/test/composables.test.ts`

## Scope

- Add focused tests in `packages/nuxt/test/composables.test.ts` for routed
  service `create`, `update`, and `remove` URLs.
- Include at least one string-key mutation case so route aliasing and key
  formatting are covered together.
- Fix `useOData` only if the new tests expose inconsistent route handling.
- Preserve existing direct-service, key-formatting, dot-notation, and root
  service behavior.

## Non-Goals

- Do not change proxy routing, request parsing, or OData target URL resolution.
- Do not add new mutation methods or change `$odata` semantics.
- Do not change generated registry types.
- Do not add dependencies.

## Acceptance Criteria

- [x] Tests cover routed service `create`.
- [x] Tests cover routed service `update`.
- [x] Tests cover routed service `remove`.
- [x] Existing Nuxt composable tests remain green.
- [x] No runtime behavior changes are made unless a test proves a bug.

## Verification

Task-local checks:

- `pnpm.cmd exec vitest run packages/nuxt/test/composables.test.ts`
- `pnpm.cmd --filter @bc8-odx/nuxt run verify`
- `pnpm.cmd run typecheck`

Checkpoint or broad checks, if required:

- `pnpm.cmd run lint`

Setup/data prerequisites:

- Before editing, inspect `git status --short` and preserve any unrelated
  uncommitted edits in `packages/nuxt/test/composables.test.ts`.
- Use `pnpm.cmd`, not `pnpm`, on this Windows machine because PowerShell blocks
  `.ps1` launchers.

If a check is skipped, record why and the residual risk in Handoff Notes.

## Risk Notes

Low risk if this stays test-only or limited to a proven local composable route
bug. Separate review is not required unless implementation changes public
composable contracts, generated types, or proxy behavior.

## Handoff Notes

- changed files: `packages/nuxt/test/composables.test.ts`, `.agents/tasks/done/040-cover-routed-nuxt-mutations.md`, `.agents/tasks/ready/040-cover-routed-nuxt-mutations.md`
- summary: added focused Nuxt composable tests proving configured service routes are used for routed `create`, `update`, and `remove` mutation calls. The routed update case also covers string-key formatting and escaping.
- tests run:
  - `pnpm.cmd exec vitest run packages/nuxt/test/composables.test.ts` - pass, 22 tests
  - `pnpm.cmd --filter @bc8-odx/nuxt run verify` - pass, 3 files / 12 tests plus minimal playground check; existing Node DEP0155 warnings were emitted by dependencies
  - `pnpm.cmd run typecheck` - pass
  - `pnpm.cmd run lint` - pass
- skipped checks and residual risk: none
- self-check result: scope, acceptance criteria, API/domain expectations, architecture boundaries, and unrelated-change preservation checked. Runtime `useOData.ts` was not changed because the test-first run passed.
- review requirement decision: separate review not required. This stayed a low-risk test-only change with no public contract, runtime, proxy, dependency, or generated type changes.
- task state movement: moved from `.agents/tasks/ready/` to `.agents/tasks/done/` by patch after `Move-Item` was denied by local permissions.
- `.agents/NEXT.md` update: already pointed at the next ready task 039 when completion was recorded; no further change was needed.
- commit hash: recorded in final response after commit.
- known gaps: none for the scoped routed mutation coverage.
