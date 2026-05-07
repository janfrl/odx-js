# Task: Document dev/prod Explorer runtime differences

Status: done
Owner: Codex
Created: 2026-05-07
Risk: medium
Review: required

## Objective

Document the current development versus production Explorer runtime behavior
and the endpoint policy changes from task 077 so contributors and operators can
understand what is available locally, what is available after deployment, and
which production gaps are intentional follow-up work.

## Context

Task 077 (`1b07b23`) and its integration fix (`4625ca7`) hardened the
production `/__odx__` endpoint policy, AppRouter routing, and production
configuration redaction. The focused re-review approved the changes with no
findings. The operator requested a dedicated documentation task before
continuing the production runtime sequence.

Relevant files:

- `AGENTS.md`
- `README.md`
- `CONTRIBUTING.md`
- `.agents/WORKFLOW.md`
- `.agents/decisions/001-production-explorer-runtime-apis.md`
- `.agents/tasks/done/077-harden-production-explorer-endpoints-and-config.md`
- `ARCHITECTURE.md`
- `API.md`
- `SECURITY.md`
- `DEPLOYMENT.md`
- `docs/content/en`
- `docs/content/de`

## Scope

- Update durable root documentation where the behavior belongs:
  - `ARCHITECTURE.md` for delivery modes, runtime boundaries, and data flow.
  - `API.md` for the internal `/__odx__` endpoint contract.
  - `SECURITY.md` for auth, redaction, payload limits, and disabled production
    behaviors.
  - `DEPLOYMENT.md` for BTP/AppRouter deployment expectations and operational
    differences.
- Update user-facing docs under `docs/content/en` and `docs/content/de` where
  relevant existing pages describe Explorer, deployment, configuration,
  security, or runtime APIs.
- Clearly separate current behavior from planned follow-up work in the
  production Explorer runtime sequence.
- Keep the later implementation tasks intact; this task only documents the
  current policy and already-planned direction.

## Non-Goals

- Do not change production endpoint behavior.
- Do not add db0, evlog, persistence, metadata refresh, SDK generation, or UI
  behavior.
- Do not redesign the Explorer docs structure unless an existing page clearly
  needs a small placement adjustment.
- Do not document secrets, private endpoints, or environment-specific customer
  values.
- Do not move or rewrite the remaining Epic 12 implementation tasks.

## Acceptance Criteria

- [x] Docs distinguish the embedded Nuxt DevTools Explorer used during local
  development from the standalone deployed Explorer served behind the
  AppRouter.
- [x] Docs explain auth differences: development DevTools behavior versus
  production SAP security context requirements for `/__odx__` runtime APIs.
- [x] Docs list the current production `/__odx__` endpoint policies, including
  which endpoints are enabled, disabled, sanitized, authenticated, or narrowly
  routed after task 077 and the integration fix.
- [x] Docs state that production `/__odx__/config` uses an allowlist including
  top-level `basePath`, `mode`, and `services`.
- [x] Docs state the sanitized production service fields that may be exposed
  and make clear that backend URLs, destinations, auth, headers, rules,
  unknown service fields, global secrets, runtime paths, hooks, DevTools
  config, `forwardAuthHeader`, and `versions.node` remain redacted or omitted.
- [x] Docs distinguish runtime metadata refresh from TypeScript SDK generation,
  marking the current state and planned future state clearly. Current
  production behavior must not imply that production can regenerate SDK files.
- [x] Docs describe the current production-disabled logs behavior and identify
  the planned db0-backed log store/redaction follow-up without implying it is
  already implemented.
- [x] Docs say which development behaviors must still redact secrets or limit
  payloads, especially traffic logs, outbound headers, auth/session/CSRF data,
  and large request/response bodies.
- [x] English and German docs stay aligned when both language trees contain a
  relevant page.

## Verification

Task-local checks:

- `git diff --check`
- Review the changed Markdown by inspection for broken links, stale task
  references, and current/future wording.

Optional docs checks, if the touched docs package has a focused verify command
available and dependencies are installed:

- `pnpm.cmd --filter docs run verify`

If a check is skipped, record why and the residual risk in Handoff Notes.

## Risk Notes

Medium risk because this is documentation-only, but it describes auth,
security, redaction, deployment routing, and internal runtime API contracts.
Separate review is required so the documented contract matches the reviewed
task 077 behavior and does not over-promise later runtime work.

## Handoff Notes

- changed files: `ARCHITECTURE.md`, `API.md`, `SECURITY.md`,
  `DEPLOYMENT.md`, `docs/content/en/5.explorer/1.setup.md`,
  `docs/content/en/5.explorer/2.reference.md`,
  `docs/content/en/2.nuxt/4.deployment.md`,
  `docs/content/en/2.nuxt/5.module-reference.md`,
  `docs/content/en/3.proxy/3.providers.md`,
  `docs/content/en/3.proxy/4.reference.md`,
  `docs/content/en/1.ecosystem/4.troubleshooting.md`,
  `docs/content/de/5.explorer/1.setup.md`,
  `docs/content/de/5.explorer/2.reference.md`,
  `docs/content/de/2.nuxt/4.deployment.md`,
  `docs/content/de/2.nuxt/5.module-reference.md`,
  `docs/content/de/3.proxy/3.providers.md`,
  `docs/content/de/3.proxy/4.reference.md`,
  `docs/content/de/1.ecosystem/4.troubleshooting.md`,
  `docs/public/api-reference.json`, `.agents/NEXT.md`, and this task file.
- summary: Documented the local Nuxt DevTools Explorer versus deployed
  standalone Explorer split; production SAP security-context requirements;
  narrowed AppRouter `/__odx__` runtime routing; production config allowlist and
  redaction omissions; current production endpoint behavior; runtime metadata
  refresh versus SDK generation; disabled production logs and planned
  db0-backed `OdxLogStore`; and development redaction/payload-limit
  expectations in root and aligned English/German docs.
- tests run:
  - `git diff --check`
  - `pnpm.cmd --filter docs run verify`
- skipped checks and residual risk: None. The first sandboxed docs verify run
  failed with Windows `spawn EPERM` while starting esbuild through `tsx`; the
  same command passed when rerun outside the sandbox with approval.
- self-check result: Scope stayed documentation/workflow-only. No runtime code,
  tests, package configuration, production behavior, task ordering, persistence,
  metadata refresh, SDK generation, or UI behavior was changed. Current and
  planned behavior are separated in the docs.
- review requirement decision: Separate review is required because the task
  explicitly marks review required and the docs describe auth, redaction,
  deployment routing, and internal runtime API contracts.
- task state movement: Normal `Move-Item` to `in-progress` failed with
  filesystem access denied, so the task was moved from `ready/` to `done/`
  through the final patch after implementation and verification.
- `.agents/NEXT.md` update: Updated to request a fresh Reviewer for this
  completed documentation task before continuing to task 078.
- commit hash: `d754437`.
- known gaps: No live SAP BTP/AppRouter smoke test was performed; this was a
  documentation task. Production logs, db0 persistence, runtime metadata
  refresh, and standalone UI alignment remain planned follow-up tasks.
