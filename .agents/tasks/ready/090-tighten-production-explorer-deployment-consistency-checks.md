# Task: Tighten production Explorer deployment consistency checks

Status: ready
Owner: unassigned
Created: 2026-05-08
Risk: high
Review: required

## Objective

Expand deterministic local deployment verification so AppRouter, MTA module,
and standalone Explorer routing assumptions stay aligned after the production
runtime sequence.

## Context

Tasks 077-086 settled the deployed Explorer route split: `/__odx__/client` and
`/__odx__/client/*` route to the standalone Explorer UI, while only the
supported `/__odx__/{config,logs,schema,generate,types,me}` runtime APIs route
to the proxy. Existing AppRouter tests cover the route split, but deployment
reviews repeatedly noted that no live BTP/AppRouter smoke test was performed.
Strengthen the local consistency checks around the same deployment contract.

Relevant files:

- `.agents/reviews/077-harden-production-explorer-endpoints-and-config-review.md`
- `.agents/reviews/082-align-standalone-explorer-runtime-ui-review.md`
- `.agents/reviews/086-document-dev-prod-explorer-runtime-differences-review.md`
- `mta.yaml`
- `packages/approuter/xs-app.json`
- `packages/approuter/test/deployment-config.test.ts`
- `packages/approuter/package.json`

## Scope

Include:

- Extend the AppRouter package verification test to assert the `odx-proxy` and
  `odx-explorer` MTA modules provide the destinations consumed by
  `odx-approuter`.
- Assert AppRouter destinations for proxy and Explorer forward auth tokens.
- Assert the proxy module binds XSUAA, Destination, and Connectivity services,
  and the Explorer UI module binds XSUAA.
- Assert no broad `/__odx__/*` catch-all route can swallow deployed Explorer
  client assets or expose unsupported proxy runtime APIs.
- Keep the checks deterministic through config parsing and route-resolution
  tests.

## Non-Goals

- Do not deploy to Cloud Foundry.
- Do not start a real SAP AppRouter process.
- Do not change runtime endpoint behavior unless a consistency check exposes a
  real configuration bug.
- Do not update user-facing deployment docs unless the configuration contract
  changes.

## Acceptance Criteria

- [ ] `pnpm.cmd --filter odx-approuter run verify` verifies the MTA
      provider/consumer relationship for `odx-proxy-backend` and
      `odx-explorer-ui`.
- [ ] The verification proves both AppRouter destinations forward auth tokens.
- [ ] The verification proves the proxy and Explorer modules have the required
      service bindings for the documented production runtime.
- [ ] The verification rejects broad `/__odx__/*` catch-all routes and
      unsupported runtime endpoint routes.
- [ ] Existing route-resolution tests for client assets and runtime APIs remain
      intact.

## Verification

Task-local checks:

- `pnpm.cmd --filter odx-approuter run verify`
- `pnpm.cmd run lint`
- `pnpm.cmd run typecheck`
- `git diff --check`

Checkpoint or broad checks, if required:

- none

Setup/data prerequisites:

- none

If a check is skipped, record why and the residual risk in Handoff Notes.

## Risk Notes

High risk because this guards deployment/runtime boundaries and production
authentication routing. Separate review is required under the workflow review
policy for deployment configuration verification.

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
