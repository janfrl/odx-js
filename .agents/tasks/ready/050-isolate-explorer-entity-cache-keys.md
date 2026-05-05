# Task: Isolate Explorer entity cache keys

Status: ready
Owner: unassigned
Created: 2026-05-05
Risk: medium
Review: conditional - required if visible UI behavior, internal endpoint contracts, or server routing changes

## Objective

Prevent Explorer entity preview cache collisions when service or entity-set
names contain separator characters.

## Context

Task 046 encoded Explorer internal endpoint query values for service and entity
names containing `&`, `#`, spaces, or `?`. The next narrow state risk is the
entity preview cache key in Explorer state: it currently combines service and
entity names with a plain separator. Distinct service/entity pairs can produce
the same cache key when names contain that separator, causing stale preview
data, query text, or errors to be restored for the wrong selection.

Relevant docs and files:

- `AGENTS.md`
- `CONTRIBUTING.md`
- `.agents/WORKFLOW.md`
- `.agents/tasks/done/046-encode-explorer-internal-endpoint-params.md`
- `packages/explorer/composables/useODataState.ts`
- `packages/explorer/composables/useEntityExplorer.ts`
- `packages/explorer/test/state.test.ts`

## Scope

- Add a focused failing Explorer state test first for two distinct
  service/entity selections that would collide with the current cache key.
- Update Explorer entity preview cache-key construction so service and entity
  values are isolated unambiguously.
- Preserve cached preview data behavior when reselecting the exact same
  service/entity pair.
- Keep changes limited to Explorer state/composable logic and focused tests.

## Non-Goals

- Do not change Explorer endpoint paths, query parameter names, or request
  methods.
- Do not redesign Explorer UI, add visible controls, or start browser-mode
  verification.
- Do not change public proxied OData URLs, proxy runtime behavior, Nuxt module
  behavior, dependencies, or lockfiles.
- Do not introduce broad cache eviction, persistence, or storage policy changes.

## Acceptance Criteria

- [ ] A focused test proves distinct service/entity pairs no longer share
  cached preview state.
- [ ] Existing cache restore behavior still works for reselecting the exact
  same service/entity pair.
- [ ] Cache-key construction is centralized or made obviously consistent across
  the Explorer composables that read/write entity preview cache entries.
- [ ] Existing Explorer state tests remain green.
- [ ] No visible UI layout or browser-only behavior changes are included.

## Verification

Task-local checks:

- `pnpm.cmd --filter @bc8-odx/explorer exec vitest run test/state.test.ts`
- `pnpm.cmd --filter @bc8-odx/explorer run verify`
- `pnpm.cmd run typecheck`

Checkpoint or broad checks, if required:

- `pnpm.cmd run lint`

Setup/data prerequisites:

- Use mocked Explorer state tests only.
- Use `pnpm.cmd`, not `pnpm`, on this Windows machine because PowerShell blocks
  `.ps1` launchers.

If a check is skipped, record why and the residual risk in Handoff Notes.

## Risk Notes

Medium risk because this touches Explorer state restoration behavior. Separate
review is not required if the change stays in cache-key construction with
focused tests and does not change UI layout, endpoint contracts, or server
routing.

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
