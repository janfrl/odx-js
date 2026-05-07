# Task: Align standalone Explorer runtime UI

Status: ready
Owner: unassigned
Created: 2026-05-07
Risk: medium
Review: required

## Objective

Update the Explorer UI to reflect the runtime split between Refresh Metadata,
development SDK regeneration, generated types, and production schema/log
inspection.

## Context

The Explorer app is reused as a DevTools iframe and as a standalone deployed UI.
After the runtime API changes, labels and states should not imply that
production can regenerate TypeScript SDK files inside Nitro.

Relevant files:

- `.agents/decisions/001-production-explorer-runtime-apis.md`
- `.agents/tasks/ready/080-separate-runtime-metadata-refresh-from-sdk-generation.md`
- `.agents/tasks/ready/081-use-runtime-metadata-cache-for-schema-and-config.md`
- `packages/explorer/app.vue`
- `packages/explorer/nuxt.config.ts`
- `packages/explorer/composables/useODataState.ts`
- `packages/explorer/components/tabs/TabServices.vue`
- `packages/explorer/components/entity/OfflineState.vue`
- `packages/explorer/components/tabs/TabOverview.vue`
- `packages/explorer/test/state.test.ts`

## Scope

- Rename production-facing action text from Regenerate SDK to Refresh Metadata
  where appropriate.
- Keep development SDK regeneration affordances only when API responses indicate
  generation is supported.
- Add support for configurable ODX API base/origin if standalone deployment
  needs to call a separate proxy origin.
- Show stale/missing metadata states clearly.
- Hide or soften generated-types UI when types are unavailable in production.
- Add focused Explorer state tests.
- Browser-verify visual changes if component layout or interaction changes are
  more than text/state branching.

## Non-Goals

- Do not change proxy endpoint security.
- Do not add persistence dependencies.
- Do not change metadata cache implementation.
- Do not introduce a marketing/landing page.

## Acceptance Criteria

- [ ] Production users see Refresh Metadata semantics, not SDK-generation
  promises.
- [ ] Development users can still trigger SDK regeneration when supported.
- [ ] Standalone Explorer can be configured for the correct API base.
- [ ] Stale/missing metadata states are represented without misleading success
  messages.
- [ ] Relevant state tests pass.

## Verification

Task-local checks:

- `pnpm.cmd --filter @bc8-odx/explorer run verify`
- `pnpm.cmd run lint`
- `pnpm.cmd run typecheck`

Browser verification:

- Required if layout or interactive behavior changes beyond labels/state
  branching. Use the existing local app workflow and record the tested URL and
  viewport.

If a check is skipped, record why and the residual risk in Handoff Notes.

## Risk Notes

Medium risk because this changes Explorer product behavior and production
runtime messaging. Separate review is required because it depends on high-risk
runtime endpoint work.

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
