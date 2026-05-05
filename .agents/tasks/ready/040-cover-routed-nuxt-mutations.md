# Task: Cover routed Nuxt mutations

Status: ready
Owner: unassigned
Created: 2026-05-05
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

- [ ] Tests cover routed service `create`.
- [ ] Tests cover routed service `update`.
- [ ] Tests cover routed service `remove`.
- [ ] Existing Nuxt composable tests remain green.
- [ ] No runtime behavior changes are made unless a test proves a bug.

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

