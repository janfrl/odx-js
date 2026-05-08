# Task: Complete or remove Explorer mockdata API

Status: done
Owner: Codex
Created: 2026-05-07
Risk: medium
Review: required

## Objective

Resolve the mismatch where Explorer calls `/__odx__/mockdata`, but the proxy
Nitro module does not register a matching backend handler.

## Context

Explorer exposes mock-data clear behavior through `useODataState`, while
`packages/proxy/src/nitro.ts` registers only logs, config, generate, schema,
types, and me internal handlers. The current UI/API mismatch is confusing for
both development and deployed Explorer usage.

Relevant files:

- `.agents/decisions/001-production-explorer-runtime-apis.md`
- `packages/proxy/src/nitro.ts`
- `packages/proxy/src/api/*`
- `packages/explorer/composables/useODataState.ts`
- `packages/explorer/composables/useEntityExplorer.ts`
- `packages/explorer/test/state.test.ts`
- `docs/content/en/5.explorer/1.setup.md`
- `docs/content/de/5.explorer/1.setup.md`

## Scope

- Decide within implementation whether to add a real backend handler or remove
  the exposed UI/state call.
- If adding a handler, keep it clearly development/mock-only and protect it in
  production.
- If removing the call, update Explorer UI/state and docs so mock-data clearing
  is not advertised as a server feature.
- Add focused tests for the chosen behavior.

## Non-Goals

- Do not add db0.
- Do not implement full mock data management unless the minimal clear behavior
  is already well-defined and safe.
- Do not change normal OData proxy behavior.
- Do not redesign Explorer data browser UI beyond removing or wiring the
  mismatched action.

## Acceptance Criteria

- [x] Explorer no longer calls an unregistered `/__odx__/mockdata` endpoint.
- [x] The chosen mock-data behavior is documented and tested.
- [x] Production behavior cannot delete arbitrary files or customer data.
- [x] Local development behavior remains clear.

## Verification

Task-local checks:

- `pnpm.cmd --filter @bc8-odx/explorer run verify`
- `pnpm.cmd --filter @bc8-odx/proxy run verify`
- `pnpm.cmd run lint`
- `pnpm.cmd run typecheck`

If a check is skipped, record why and the residual risk in Handoff Notes.

## Risk Notes

Medium risk because this touches Explorer runtime actions and potential file
deletion behavior if implemented as a backend route. Separate review is
required unless the implementation is documentation-only removal.

## Handoff Notes

- changed files:
  - `packages/explorer/composables/useODataState.ts`
  - `packages/explorer/composables/useEntityExplorer.ts`
  - `packages/explorer/components/entity/Toolbar.vue`
  - `packages/explorer/test/state.test.ts`
  - `docs/content/en/5.explorer/1.setup.md`
  - `docs/content/de/5.explorer/1.setup.md`
  - `.agents/NEXT.md`
  - `.agents/tasks/done/083-complete-or-remove-explorer-mockdata-api.md`
- summary: Removed the Explorer mock-data clear state action and Data Browser
  Clear button instead of adding a backend deletion route. The Explorer no
  longer builds or calls `/__odx__/mockdata`; docs now state that exported mock
  fixture files are managed directly in the development workspace and that no
  server-side clear action is exposed.
- tests run:
  - `pnpm.cmd --filter @bc8-odx/explorer run verify` (pass outside sandbox; the
    sandboxed run failed with Windows `spawn EPERM` while Vitest/esbuild loaded
    config)
  - `pnpm.cmd --filter @bc8-odx/proxy run verify` (pass outside sandbox; the
    sandboxed run failed with Windows `spawn EPERM` while Vitest/esbuild loaded
    config)
  - `pnpm.cmd run lint` (pass)
  - `pnpm.cmd run typecheck` (pass)
  - `git diff --check` (pass; Git reported expected LF-to-CRLF working-copy
    warnings)
- skipped checks and residual risk: none skipped. No live deployed
  AppRouter/BTP smoke test was run; this task removed an unregistered Explorer
  action and did not change deployed proxy routing.
- self-check result: Scope and non-goals satisfied. No db0, no mock-data
  management backend, no normal OData proxy behavior changes, and no unrelated
  UI redesign.
- review requirement decision: Separate review required because the task file
  explicitly marks review as required and the change touches Explorer runtime
  action surface and documented production safety behavior.
- task state movement: Moved from `.agents/tasks/ready/` to
  `.agents/tasks/done/` after implementation and verification.
- `.agents/NEXT.md` update: Updated to request a Reviewer for task 083 and to
  preserve task 085 as the next task after review approval.
- commit hash: pending commit.
- known gaps: None blocking.
