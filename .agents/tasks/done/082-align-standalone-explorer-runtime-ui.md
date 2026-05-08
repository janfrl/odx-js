# Task: Align standalone Explorer runtime UI

Status: done
Owner: Codex
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
- `.agents/tasks/done/080-separate-runtime-metadata-refresh-from-sdk-generation.md`
- `.agents/tasks/done/081-use-runtime-metadata-cache-for-schema-and-config.md`
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

- [x] Production users see Refresh Metadata semantics, not SDK-generation
  promises.
- [x] Development users can still trigger SDK regeneration when supported.
- [x] Standalone Explorer can be configured for the correct API base.
- [x] Stale/missing metadata states are represented without misleading success
  messages.
- [x] Relevant state tests pass.

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

- changed files: `packages/explorer/nuxt.config.ts`,
  `packages/explorer/composables/useODataState.ts`,
  `packages/explorer/composables/useEntityExplorer.ts`,
  `packages/explorer/components/DataEditor.vue`,
  `packages/explorer/components/entity/OfflineState.vue`,
  `packages/explorer/components/tabs/TabOverview.vue`,
  `packages/explorer/components/tabs/TabProxy.vue`,
  `packages/explorer/components/tabs/TabServices.vue`,
  `packages/explorer/test/state.test.ts`, `.agents/NEXT.md`, and this task
  file.
- summary: Added a configurable public `odxApiBase` for standalone Explorer
  API/runtime proxy calls; routed config, logs, schema, generate, mock-data,
  identity, entity reads, mutations, and deletes through the configured base;
  renamed production-facing generation actions to Refresh Metadata; kept
  development SDK labels when config indicates local generation support; added
  runtime metadata status badges/messages; mapped missing metadata to offline
  and stale metadata to degraded; and softened generated-types UI to
  build-time/development wording.
- tests run:
  - `pnpm.cmd --filter @bc8-odx/explorer run verify`
  - `pnpm.cmd run lint`
  - `pnpm.cmd run typecheck`
  - headless Chrome browser check at
    `http://127.0.0.1:3401/__odx__/client/`, viewport `1440x1000`, with
    mocked production-like config for stale and missing metadata. Screenshot:
    `C:\tmp\odx-explorer-task082.png`.
- skipped checks and residual risk: No requested check was skipped. The first
  sandboxed Explorer verify failed with Windows `spawn EPERM` while loading
  Vitest/esbuild; the same command passed outside the sandbox with approval.
  No live SAP BTP/AppRouter browser smoke test was performed.
- self-check result: Scope stayed on Explorer runtime UI/state and standalone
  API-base behavior. No proxy endpoint security, persistence dependency,
  metadata cache implementation, db0, evlog, generated SDK behavior, or
  marketing/landing page was changed.
- review requirement decision: Separate review is required because the task is
  marked review-required and changes production runtime messaging and
  standalone Explorer behavior.
- task state movement: Moved from `.agents/tasks/ready/` to
  `.agents/tasks/done/` after implementation and verification.
- `.agents/NEXT.md` update: Updated to request a fresh Reviewer for task 082
  before continuing to task 083, then task 085.
- commit hash: `36136d8795a1bbf9e3038eb027e642c52ee770f5`.
- known gaps: Browser verification used mocked runtime API responses rather
  than a live BTP/AppRouter deployment.
