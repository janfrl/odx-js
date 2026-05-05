# Epics

This file connects the high-level roadmap to implementable agent tasks. It is
operational and may change frequently.

## Epic 01: Repository Quality Baseline

Goal: keep the normal local verification path green and reliable.

Deliverables:

- lint, typecheck, and tests can be run locally with documented commands
- lint scope matches project source and operational documentation boundaries
- docs components satisfy the configured style rules

Candidate tasks:

- `.agents/tasks/done/001-restore-lint-baseline.md`

Exit criteria:

- `pnpm.cmd run lint`, `pnpm.cmd run typecheck`, and `pnpm.cmd run test` pass or
  have documented residual risk

## Epic 02: Proxy Correctness And Observability

Goal: improve confidence in proxy behavior with tests-first bug fixes and
measurement.

Deliverables:

- async custom validation behavior is verified before implementation changes
- DevTools log data exposure is audited without broad redaction heuristics
- proxy performance overhead has a local baseline benchmark
- high-risk proxy changes receive independent review when required

Candidate tasks:

- `.agents/tasks/done/002-audit-devtools-log-data-exposure.md`
- `.agents/tasks/done/003-await-async-rule-validation.md`
- `.agents/tasks/done/007-add-proxy-performance-benchmarks.md`
- `.agents/tasks/done/014-expand-proxy-performance-scenarios.md`
- `.agents/tasks/done/015-expand-btp-destination-edge-tests.md`
- `.agents/tasks/ready/017-bound-btp-destination-cache-lifetime.md`
- `.agents/tasks/ready/021-record-proxy-benchmark-baseline-output.md`

Exit criteria:

- focused proxy tests cover the fixed behavior
- benchmark output gives a usable overhead baseline
- required review notes exist for high-risk changes

## Epic 03: Nuxt Generation And Composable Correctness

Goal: make setup-time type generation and public composable URL construction
more robust.

Deliverables:

- type generation command construction is verified before being changed
- OData string key escaping is verified before implementation changes
- existing registry augmentation behavior remains intact

Candidate tasks:

- `.agents/tasks/done/004-harden-type-generation-process-exec.md`
- `.agents/tasks/done/005-escape-odata-key-literals.md`

Exit criteria:

- focused Nuxt package tests pass
- type generation and composable contracts remain documented

## Epic 04: Agent Workflow Adoption

Goal: keep `.agents/` useful for ongoing ODX work rather than template
adoption.

Deliverables:

- `.agents/NEXT.md` points to one concrete task or review step
- adoption-only guidance is removed or intentionally retained
- backlog and roadmap describe current ODX priorities

Candidate tasks:

- `.agents/tasks/done/006-finish-agent-workflow-adoption.md`

Exit criteria:

- the next chat can resume from repository state without template-adoption
  ambiguity

## Epic 05: Package Isolation And Explorer Confidence

Goal: make package boundaries easier to understand and verify without damaging
the existing Explorer experience.

Deliverables:

- each package has an independent verification story
- selected package playgrounds or examples are planned before implementation
- Explorer test coverage improves without visual churn
- browser verification, when needed, uses port `3000` and runs late in the task

Candidate tasks:

- `.agents/tasks/done/008-design-package-isolation-playgrounds.md`
- `.agents/tasks/done/009-expand-explorer-tests.md`
- `.agents/tasks/done/010-add-core-proxy-standalone-examples.md`
- `.agents/tasks/done/011-add-minimal-nuxt-package-playground.md`
- `.agents/tasks/done/012-expand-explorer-state-tests.md`
- `.agents/tasks/done/013-fix-nuxt-e2e-node24-startup.md`
- `.agents/tasks/done/016-document-package-verification-commands.md`
- `.agents/tasks/ready/018-add-explorer-traffic-search-and-status-filters.md`
- `.agents/tasks/ready/019-harden-explorer-query-builder-serialization.md`
- `.agents/tasks/ready/020-add-explorer-package-verification-command.md`

Exit criteria:

- implementation tasks exist for package-level examples or playgrounds
- Explorer additions are test-first and do not alter UI unless a bug is proven

## Epic 06: Release Confidence Follow-Ups

Goal: close recent residual risks before considering broader optimization or
release work.

Deliverables:

- BTP destination cache entries have bounded lifetime and focused tests
- Explorer diagnostics scale better for larger local sessions
- Explorer query construction handles common literal edge cases
- Explorer has the same package-level verification discoverability as core,
  proxy, and Nuxt
- proxy benchmark output can be compared without scraping console text

Candidate tasks:

- `.agents/tasks/ready/017-bound-btp-destination-cache-lifetime.md`
- `.agents/tasks/ready/018-add-explorer-traffic-search-and-status-filters.md`
- `.agents/tasks/ready/019-harden-explorer-query-builder-serialization.md`
- `.agents/tasks/ready/020-add-explorer-package-verification-command.md`
- `.agents/tasks/ready/021-record-proxy-benchmark-baseline-output.md`

Exit criteria:

- security-sensitive cache work has independent review
- Explorer tests cover the new state/query behavior
- package verification docs include Explorer
- proxy benchmark JSON output is optional and artifact-safe
