# Task: Tighten production Explorer deployment consistency checks

Status: done
Owner: Codex
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

- [x] `pnpm.cmd --filter odx-approuter run verify` verifies the MTA
      provider/consumer relationship for `odx-proxy-backend` and
      `odx-explorer-ui`.
- [x] The verification proves both AppRouter destinations forward auth tokens.
- [x] The verification proves the proxy and Explorer modules have the required
      service bindings for the documented production runtime.
- [x] The verification rejects broad `/__odx__/*` catch-all routes and
      unsupported runtime endpoint routes.
- [x] Existing route-resolution tests for client assets and runtime APIs remain
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

- Changed files:
  - `packages/approuter/test/deployment-config.test.ts`
  - `.agents/tasks/done/090-tighten-production-explorer-deployment-consistency-checks.md`
  - `.agents/NEXT.md`
- Summary:
  - Extended deterministic AppRouter deployment config verification with MTA
    helper parsing for module `requires` and `provides` entries.
  - Added assertions that `odx-approuter` consumes `odx-proxy-url` and
    `odx-explorer-url` as destination entries named `odx-proxy-backend` and
    `odx-explorer-ui`, and that both destination entries set
    `forwardAuthToken: true`.
  - Added assertions that `odx-proxy` provides `odx-proxy-url`,
    `odx-explorer` provides `odx-explorer-url`, and both providers expose the
    expected `${default-url}` URL property.
  - Added assertions that `odx-proxy` binds XSUAA, Destination, and
    Connectivity services, while `odx-explorer` binds XSUAA.
  - Added negative route-resolution coverage so broad `/__odx__/*` catch-all
    routes cannot send deployed Explorer client assets to the proxy or expose
    unsupported runtime paths such as `/__odx__/mockdata`.
  - No runtime endpoint behavior, MTA configuration, AppRouter routes,
    package metadata, dependencies, or user-facing deployment docs were
    changed.
- Tests run:
  - `pnpm.cmd --filter odx-approuter run verify` - pass outside sandbox, 1
    file, 6 tests. The first sandboxed run failed with Windows `spawn EPERM`
    while Vitest/esbuild loaded config, so the exact command was rerun outside
    the sandbox.
  - `pnpm.cmd run lint` - pass after fixing the literal `${default-url}`
    assertion string that ESLint correctly flagged as
    `no-template-curly-in-string`.
  - `pnpm.cmd run typecheck` - pass.
  - `git diff --check` - pass; Git reported only the existing CRLF
    normalization warning for the edited TypeScript file.
- Skipped checks and residual risk:
  - No checks skipped.
  - No live SAP BTP, Cloud Foundry, or real AppRouter smoke test was run; the
    task explicitly required deterministic config parsing and route-resolution
    tests instead.
- Self-check result:
  - Scope matches task 090. Changes are limited to deterministic AppRouter
    deployment consistency tests and `.agents` workflow state.
  - Acceptance criteria are covered by the expanded `odx-approuter` verify
    test suite.
  - Root documentation and user-facing deployment docs were not updated
    because the configuration contract did not change.
  - No secrets, customer endpoints, generated files, dependencies, lockfiles,
    runtime code, or endpoint behavior were changed.
- Review requirement decision:
  - Separate review is required because task 090 is high risk and guards
    deployment/runtime boundaries and production authentication routing.
- Task state movement:
  - Moved from `.agents/tasks/ready/` to `.agents/tasks/in-progress/` at
    start.
  - Moved to `.agents/tasks/done/` after implementation and required
    verification.
- `.agents/NEXT.md` update:
  - Updated to start a fresh Reviewer for task 090.
- Commit hash:
  - Pending final implementation commit; report the completed commit hash in
    the final response.
- Known gaps:
  - No live SAP BTP/AppRouter deployment smoke test was performed by design.
