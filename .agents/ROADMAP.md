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

- Bound security-sensitive destination cache lifetimes.
- Improve Explorer diagnostics for larger local sessions.
- Make benchmark results easier to compare before runtime optimization work.
- Keep package-level verification discoverable across core, proxy, Nuxt, and
  Explorer.
