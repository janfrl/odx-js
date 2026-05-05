# Roadmap

This roadmap is an operational planning document. Keep stable product scope in
`README.md` and stable architecture in `ARCHITECTURE.md` when that file exists.

Use `.agents/EPICS.md` for the more detailed implementation breakdown.

## Phase 1: Quality Baseline

- Keep `lint`, `typecheck`, and tests green.
- Close focused correctness bugs with tests-first implementation.
- Record required reviews for security-sensitive proxy and process-execution
  changes.

## Phase 2: Package Confidence

- Add performance benchmarks for proxy overhead.
- Design independent package playgrounds or examples for `core`, `proxy`,
  `nuxt`, and `explorer`.
- Improve package-level verification without coupling everything to the full
  playground.

## Phase 3: Product Confidence

- Expand Explorer tests carefully without visual churn.
- Add BTP-oriented integration coverage where it can be verified locally.
- Revisit production TLS defaults as a documented security decision.

## Phase 4: Release Confidence Follow-Ups

- Preserve buffered proxy HTTP status semantics before runtime optimization
  work.
- Keep package-level verification discoverable through package-local commands.
- Improve Explorer diagnostics for larger local sessions with focused,
  test-backed polish.
- Make benchmark results easy to compare before runtime optimization work.

## Phase 5: Local Verification Polish

- Add regression coverage for edge-case successful proxy responses such as
  `204 No Content`.
- Keep docs/package verification lightweight and runnable without dev servers.
- Add automated tests around local benchmark tooling before extending it.
- Prefer relative benchmark reporting before attempting runtime optimization.

## Phase 6: Release Readiness Tightening

- Ensure package-local verification commands include both focused tests and
  package examples where practical.
- Validate malformed BTP destination payloads before broader deployment work.
- Keep Explorer confidence work state-driven and test-backed before browser
  checks.
- Add benchmark run metadata before comparing or optimizing proxy performance.
- Keep package verification guidance close to each package README.

## Phase 7: Stability Queue Refinement

- Normalize Nuxt composable URL joins without changing runtime config
  contracts.
- Reject non-HTTP(S) BTP destination targets with focused production-mode
  tests and independent review.
- Keep Explorer service/entity selection state reconciled after config refresh.
- Make benchmark comparison output explicit about missing scenarios before
  performance optimization work.
- Pin route-alias behavior for Nuxt mutation helpers.

## Phase 8: Stability And Verification Tightening

- Preserve core OData flattening behavior for entity fields that share names
  with OData envelope keys.
- Normalize proxy request parsing at base-path slash boundaries.
- Make proxy benchmark report formatting and JSON output shape testable without
  running full timing benchmarks.
- Provide a single aggregate package verification command built from existing
  package-local checks.
- Keep Explorer config-backed state reconciled through focused state tests,
  avoiding UI churn unless separately verified.

## Phase 9: Endpoint Encoding And Checkpoint Confidence

- Encode Explorer internal endpoint query values so special service and entity
  names reach internal handlers intact.
- Keep proxy benchmark comparison tooling strict enough to reject malformed
  duplicate scenario labels.
- Clarify package verification documentation now that an aggregate command runs
  package-local checks and docs extraction.
- Run a broad release confidence checkpoint before planning larger performance
  optimization or browser-level Explorer work.

## Phase 10: Stability And Deployment Verification Polish

- Keep Explorer state caches isolated for special service and entity names
  without UI redesign.
- Add deterministic local verification for deployment configuration invariants
  before changing deployment behavior.
- Continue improving benchmark comparison validation before runtime
  optimization work.
- Clarify generated metadata cache cleanup expectations in existing docs.

## Phase 11: Falsy Payload And Metadata Download Tightening

- Reject invalid proxy benchmark concurrency settings before timing loops.
- Make Nuxt metadata downloads select the correct Node client for `http://`
  and `https://` services.
- Prove and fix core V2 `d` envelope unwrapping for falsy scalar payloads
  without regressing ordinary entity properties.
- Run a stability checkpoint after the focused fixes complete.

## Phase 12: Registry And Hook Contract Tightening

- Keep generated Nuxt registry declarations valid for configured service names
  that are not TypeScript identifiers.
- Align buffered proxy response hook behavior with the existing typed generic
  and service-specific hook contract.
- Keep proxy benchmark env validation strict for timing loop controls.
- Document service-name type-generation limits narrowly after implementation.
- Run a checkpoint after the queue and required hook-contract review complete.
