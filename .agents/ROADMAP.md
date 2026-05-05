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
