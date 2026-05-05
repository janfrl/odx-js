# Task: Encode Explorer delete item IDs

Status: ready
Owner: unassigned
Created: 2026-05-05
Risk: medium
Review: conditional - required if DELETE routing semantics change beyond ID query-value encoding

## Objective

Make Explorer row deletion encode the item ID before it is placed into the
internal DELETE endpoint URL so special characters in IDs are routed as data.

## Context

Explorer internal endpoint calls already encode service and entity query values
for schema, generation, and mock data operations. `deleteItem()` currently
builds `?id=${id}` directly, so an ID containing `&`, `#`, `?`, or spaces can
be parsed incorrectly by the receiving endpoint.

Relevant files:

- `packages/explorer/composables/useEntityExplorer.ts`
- `packages/explorer/test/state.test.ts`
- `.agents/tasks/done/046-encode-explorer-internal-endpoint-params.md`
- `.agents/tasks/done/063-uri-encode-nuxt-odata-string-keys.md`

## Scope

- Add a failing test first for `deleteItem()` using an ID such as
  `A/B?x=1&R #2`.
- Stub `confirm()` and `useToast()` in the focused test as needed.
- Encode only the `id` query value used by Explorer's internal DELETE request.
- Preserve the selected service route, selected entity path, HTTP method,
  success toast, and refresh behavior.
- Keep changes inside Explorer state/composable tests and the Explorer
  composable unless a tiny package-local helper is clearly smaller.

## Non-Goals

- Do not change Nuxt composable key handling, proxy request parsing, mock-data
  clearing, service/entity endpoint encoding already covered by state tests, UI
  layout, dependencies, lockfiles, or generated files.
- Do not introduce broad shared OData key helper extraction.
- Do not redesign DELETE semantics from query ID to OData key syntax.

## Acceptance Criteria

- [ ] A focused test fails before implementation for an unencoded delete ID
  containing query separator characters.
- [ ] `deleteItem()` sends a DELETE request whose `id` query value is encoded
  with `encodeURIComponent()` or equivalent URL-safe encoding.
- [ ] Existing delete success behavior still refreshes entity data and emits
  the existing success toast.
- [ ] Existing Explorer state tests remain green without UI changes.

## Verification

Task-local checks:

- `pnpm.cmd --filter @bc8-odx/explorer exec vitest run test/state.test.ts`
- `pnpm.cmd --filter @bc8-odx/explorer run verify`
- `pnpm.cmd run lint`

Checkpoint or broad checks, if required:

- `pnpm.cmd run typecheck`

Setup/data prerequisites:

- Use deterministic Explorer state tests only.
- Use `pnpm.cmd`, not `pnpm`, on this Windows machine because PowerShell blocks
  `.ps1` launchers.

If a check is skipped, record why and the residual risk in Handoff Notes.

## Risk Notes

Medium risk because this touches Explorer runtime request construction, but it
is narrow and local to an internal DevTools endpoint. Separate review is not
required if the implementation only encodes the `id` query value and focused
tests pass.

Require separate review if the implementation changes DELETE routing shape,
proxy behavior, mock data endpoints, public Nuxt composables, or shared URL
helpers.

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
