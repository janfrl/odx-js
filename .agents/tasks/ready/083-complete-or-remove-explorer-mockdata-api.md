# Task: Complete or remove Explorer mockdata API

Status: ready
Owner: unassigned
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

- [ ] Explorer no longer calls an unregistered `/__odx__/mockdata` endpoint.
- [ ] The chosen mock-data behavior is documented and tested.
- [ ] Production behavior cannot delete arbitrary files or customer data.
- [ ] Local development behavior remains clear.

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
