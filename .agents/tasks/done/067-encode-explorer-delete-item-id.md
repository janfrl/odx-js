# Task: Encode Explorer delete item IDs

Status: done
Owner: Codex
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

- [x] A focused test fails before implementation for an unencoded delete ID
  containing query separator characters.
- [x] `deleteItem()` sends a DELETE request whose `id` query value is encoded
  with `encodeURIComponent()` or equivalent URL-safe encoding.
- [x] Existing delete success behavior still refreshes entity data and emits
  the existing success toast.
- [x] Existing Explorer state tests remain green without UI changes.

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

- changed files:
  - `packages/explorer/composables/useEntityExplorer.ts`
  - `packages/explorer/test/state.test.ts`
  - `.agents/tasks/done/067-encode-explorer-delete-item-id.md`
  - `.agents/NEXT.md`
- summary:
  - Added a focused `deleteItem()` state test using `A/B?x=1&R #2`.
  - The test verifies the selected service route, selected entity path, DELETE
    method, encoded `id` query value, success toast, and refresh behavior.
  - Updated `deleteItem()` to apply `encodeURIComponent(String(id))` only to
    the internal DELETE `id` query value.
  - Preserved route selection, entity path, method, toast title, and refresh
    behavior.
- tests run:
  - Initial sandboxed focused test command failed before assertions:
    `pnpm.cmd --filter @bc8-odx/explorer exec vitest run test/state.test.ts -t "encodes delete item IDs"`
    could not access `C:\Users\janfr\AppData\Local\node\corepack\v1\pnpm`
    (`EPERM`), so the command was rerun with approved escalation.
  - FAIL before fix after test harness adjustment:
    `pnpm.cmd --filter @bc8-odx/explorer exec vitest run test/state.test.ts -t "encodes delete item IDs"`
    failed because the first fetch call received
    `/api/odx/northwind-api/Products?id=A/B?x=1&R #2` instead of
    `/api/odx/northwind-api/Products?id=A%2FB%3Fx%3D1%26R%20%232`.
  - PASS after fix:
    `pnpm.cmd --filter @bc8-odx/explorer exec vitest run test/state.test.ts -t "encodes delete item IDs"`
    (1 test passed, 32 skipped).
  - PASS: `pnpm.cmd --filter @bc8-odx/explorer exec vitest run test/state.test.ts`
    (33 tests passed).
  - PASS: `pnpm.cmd --filter @bc8-odx/explorer run verify`
    (33 tests passed).
  - PASS: `pnpm.cmd run typecheck`.
  - Initial `pnpm.cmd run lint` failed on import ordering in the new test
    harness.
  - PASS after import-order cleanup: `pnpm.cmd run lint`.
  - PASS: `git diff --check` (LF-to-CRLF warnings only for touched files).
- skipped checks and residual risk:
  - No required checks were skipped.
- self-check result:
  - Scope stayed limited to Explorer delete request construction and focused
    Explorer state tests. No UI layout, dependencies, lockfiles, generated
    files, Nuxt composable key handling, proxy parsing, mock-data clearing, or
    shared helper extraction changed.
- review requirement decision:
  - Separate review is not required because the implementation only encodes the
    `id` query value for the existing internal DELETE request and preserves the
    DELETE routing shape, proxy behavior, mock-data endpoints, public Nuxt
    composables, and shared URL helpers.
- task state movement:
  - Moved from `.agents/tasks/ready/` to `.agents/tasks/in-progress/` at start.
  - Moved to `.agents/tasks/done/` after implementation and verification.
- `.agents/NEXT.md` update:
  - Updated to point at
    `.agents/tasks/ready/068-validate-benchmark-count-fields.md`.
- commit hash:
  - Commit containing this handoff.
- known gaps:
  - No known implementation gaps.
