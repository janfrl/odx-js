# Task: Document dev/prod Explorer runtime differences

Status: ready
Owner: unassigned
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

- [ ] Docs distinguish the embedded Nuxt DevTools Explorer used during local
  development from the standalone deployed Explorer served behind the
  AppRouter.
- [ ] Docs explain auth differences: development DevTools behavior versus
  production SAP security context requirements for `/__odx__` runtime APIs.
- [ ] Docs list the current production `/__odx__` endpoint policies, including
  which endpoints are enabled, disabled, sanitized, authenticated, or narrowly
  routed after task 077 and the integration fix.
- [ ] Docs state that production `/__odx__/config` uses an allowlist including
  top-level `basePath`, `mode`, and `services`.
- [ ] Docs state the sanitized production service fields that may be exposed
  and make clear that backend URLs, destinations, auth, headers, rules,
  unknown service fields, global secrets, runtime paths, hooks, DevTools
  config, `forwardAuthHeader`, and `versions.node` remain redacted or omitted.
- [ ] Docs distinguish runtime metadata refresh from TypeScript SDK generation,
  marking the current state and planned future state clearly. Current
  production behavior must not imply that production can regenerate SDK files.
- [ ] Docs describe the current production-disabled logs behavior and identify
  the planned db0-backed log store/redaction follow-up without implying it is
  already implemented.
- [ ] Docs say which development behaviors must still redact secrets or limit
  payloads, especially traffic logs, outbound headers, auth/session/CSRF data,
  and large request/response bodies.
- [ ] English and German docs stay aligned when both language trees contain a
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
