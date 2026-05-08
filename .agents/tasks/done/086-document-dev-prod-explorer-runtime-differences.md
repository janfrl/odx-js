# Task: Document development and production Explorer runtime differences

Status: done
Owner: Codex
Created: 2026-05-08
Risk: medium
Review: required

## Objective

Create durable user-facing documentation that explains the current development
versus production Explorer runtime behavior after the production runtime
hardening sequence, including the changes made in tasks 077-085.

## Context

The Explorer is used both as the Nuxt DevTools integration and as the deployed
standalone operations UI. The runtime behavior now intentionally differs across
development and production for authentication, redaction, log persistence,
metadata refresh, schema/config cache state, generated type artifacts, and
mock-data file management.

The current behavior is scattered across root docs, Docus pages, task notes,
and review notes. The durable public docs need one coherent comparison so users
do not infer that local DevTools behavior is available unchanged in a deployed
SAP BTP runtime.

Relevant files:

- `.agents/decisions/001-production-explorer-runtime-apis.md`
- `.agents/tasks/done/077-harden-production-explorer-endpoints-and-config.md`
- `.agents/tasks/done/078-introduce-odx-log-store-and-redaction.md`
- `.agents/tasks/done/079-add-db0-backed-explorer-log-store.md`
- `.agents/tasks/done/080-separate-runtime-metadata-refresh-from-sdk-generation.md`
- `.agents/tasks/done/081-use-runtime-metadata-cache-for-schema-and-config.md`
- `.agents/tasks/done/082-align-standalone-explorer-runtime-ui.md`
- `.agents/tasks/done/083-complete-or-remove-explorer-mockdata-api.md`
- `.agents/tasks/done/085-refresh-user-facing-explorer-runtime-docs.md`
- `.agents/reviews/085-refresh-user-facing-explorer-runtime-docs-review.md`
- `ARCHITECTURE.md`
- `API.md`
- `SECURITY.md`
- `DEPLOYMENT.md`
- `docs/content/en`
- `docs/content/de`

## Scope

Include:

- A concise development-versus-production comparison for the Explorer and
  internal `/__odx__` endpoints.
- Clear wording that the Nuxt module DevTools integration and the standalone
  Explorer share the Explorer app, while production standalone deployments call
  same-origin AppRouter/proxy APIs instead of local DevTools-only behavior.
- The production endpoint policies for `/__odx__/config`, `/__odx__/logs`,
  `/__odx__/schema`, `/__odx__/generate`, `/__odx__/types`, and `/__odx__/me`.
- The difference between runtime metadata refresh and TypeScript SDK/type
  generation.
- The db0-backed SQL log-store behavior, redaction boundary, and production
  payload policy.
- The current mock-data behavior after mock-data file management was removed
  from the Explorer UI.
- English and German Docus content, with root docs adjusted only where needed
  to avoid contradictions.

## Non-Goals

- Do not change runtime API behavior.
- Do not change the Explorer UI.
- Do not add new endpoints, logging providers, persistence adapters, or
  metadata generation features.
- Do not document unapproved future work as current behavior.
- Do not expose customer-specific BTP routes, credentials, destinations,
  backend URLs, auth details, outbound headers, TLS settings, runtime paths, or
  hooks.

## Acceptance Criteria

- [x] Users can tell which Explorer features are development-only, production
      runtime-only, or available in both modes.
- [x] The docs clearly state that production Refresh Metadata updates runtime
      metadata cache state only and does not generate TypeScript SDK files.
- [x] The docs clearly state how production config, schema, logs, types, and
      user-context endpoints are authenticated, sanitized, disabled, or backed
      by SQL storage.
- [x] English and German docs are semantically aligned.
- [x] Root docs and Docus docs do not contradict each other on Explorer
      development versus production behavior.

## Verification

Task-local checks:

- `git diff --check`
- `pnpm.cmd --filter docs run verify`

Manual checks:

- Search the changed docs for stale future-tense wording around `planned`,
  `follow-up`, `metadata refresh`, `generate`, `403`, `db0`, `mockdata`, and
  `DevTools`.
- Inspect changed English and German sections side by side for semantic
  alignment.
- Confirm docs do not expose customer-specific BTP routes, credentials,
  destinations, backend URLs, auth details, outbound headers, TLS settings,
  runtime paths, or hooks.

Setup/data prerequisites:

- none

If a check is skipped, record why and the residual risk in Handoff Notes.

## Risk Notes

Medium risk because the task is documentation-only but describes production
runtime API behavior, authentication, redaction, deployment boundaries, and
generated artifact behavior. Separate review is required by the workflow review
policy for production configuration and public/internal API contract docs.

## Handoff Notes

- changed files: `API.md`, `ARCHITECTURE.md`, `DEPLOYMENT.md`,
  `SECURITY.md`, `docs/content/en/2.nuxt/4.deployment.md`,
  `docs/content/de/2.nuxt/4.deployment.md`,
  `docs/content/en/3.proxy/4.reference.md`,
  `docs/content/de/3.proxy/4.reference.md`,
  `docs/content/en/5.explorer/2.reference.md`,
  `docs/content/de/5.explorer/2.reference.md`, `.agents/NEXT.md`, and this
  task file.
- summary: Added a coherent English and German Explorer runtime comparison
  covering UI delivery, API origin, authentication, config, schema, metadata
  refresh, generated types, traffic logs, and mock data. Expanded the Explorer
  reference endpoint policy for production `/__odx__` behavior, documented
  that no `/__odx__/mockdata` runtime endpoint exists, aligned root and Docus
  config allowlists around sanitized `metadata` cache state, and tightened
  metadata refresh wording to avoid operational detail disclosure while keeping
  the runtime-refresh versus SDK-generation boundary explicit.
- tests run:
  - `git diff --check`
  - `pnpm.cmd --filter docs run verify`
  - Manual `Select-String` search over changed docs for `planned`,
    `follow-up`, `metadata refresh`, `Refresh Metadata`, `generate`, `403`,
    `db0`, `mockdata`, `mock-data`, and `DevTools`.
  - Manual side-by-side inspection of the changed English and German Explorer
    runtime comparison and endpoint policy sections.
  - Manual added-line sensitive-detail search for customer-specific routes,
    credentials, destinations, backend URLs, auth details, outbound headers,
    TLS settings, runtime paths, and hooks.
- skipped checks and residual risk: No task-required checks were skipped. No
  live SAP BTP/AppRouter deployment smoke test was performed because this task
  is documentation-only.
- self-check result: Scope stayed on documentation and workflow state. No
  runtime code, tests, package metadata, generated app output, endpoints,
  logging providers, persistence adapters, metadata generation features, or
  Explorer UI behavior changed. The added sensitive-pattern matches are generic
  authentication/omission wording, not customer-specific operational details.
- review requirement decision: Separate review is required because task 086 is
  marked review-required and documents production runtime API behavior,
  authentication, redaction, deployment boundaries, and generated artifact
  behavior.
- task state movement: Direct `Move-Item` from `ready/` to `in-progress/` was
  blocked by Windows access denied, so the task was moved from `ready/` to
  `in-progress/` and then to `done/` through patches after implementation and
  verification.
- `.agents/NEXT.md` update: Updated to request a fresh Reviewer for completed
  task 086.
- commit hash: pending commit.
- known gaps: The assignment referenced
  `.agents/tasks/done/077-document-explorer-prod-dev-differences.md`, which is
  not present in this checkout; the actual completed task 077 file read was
  `.agents/tasks/done/077-harden-production-explorer-endpoints-and-config.md`.
  No live BTP deployment was tested.
