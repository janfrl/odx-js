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
- `.agents/tasks/done/017-bound-btp-destination-cache-lifetime.md`
- `.agents/tasks/done/021-record-proxy-benchmark-baseline-output.md`
- `.agents/tasks/done/022-preserve-buffer-proxy-success-status.md`
- `.agents/tasks/done/025-add-proxy-benchmark-compare-helper.md`
- `.agents/tasks/ready/026-preserve-buffer-proxy-204-empty-response.md`
- `.agents/tasks/ready/028-add-proxy-benchmark-compare-tests.md`
- `.agents/tasks/ready/030-add-proxy-benchmark-overhead-ratios.md`

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
- `.agents/tasks/done/018-add-explorer-traffic-search-and-status-filters.md`
- `.agents/tasks/done/019-harden-explorer-query-builder-serialization.md`
- `.agents/tasks/done/020-add-explorer-package-verification-command.md`
- `.agents/tasks/done/023-add-package-local-verify-scripts.md`
- `.agents/tasks/done/024-improve-explorer-filtered-empty-state.md`
- `.agents/tasks/ready/027-exclude-pending-logs-from-status-filters.md`
- `.agents/tasks/ready/029-add-docs-package-verify-script.md`

Exit criteria:

- implementation tasks exist for package-level examples or playgrounds
- Explorer additions are test-first and do not alter UI unless a bug is proven

## Epic 06: Release Confidence Follow-Ups

Goal: close recent residual risks before considering broader optimization or
release work.

Deliverables:

- Buffered proxy mode preserves successful backend status codes.
- Package-local verification commands are discoverable across core, proxy,
  Nuxt, Explorer, and docs.
- Explorer diagnostics clearly distinguish filtered-empty, pending, success,
  and failure states.
- proxy benchmark output can be compared across local runs without spreadsheet
  work and includes relative overhead where useful.

Candidate tasks:

- `.agents/tasks/done/017-bound-btp-destination-cache-lifetime.md`
- `.agents/tasks/done/018-add-explorer-traffic-search-and-status-filters.md`
- `.agents/tasks/done/019-harden-explorer-query-builder-serialization.md`
- `.agents/tasks/done/020-add-explorer-package-verification-command.md`
- `.agents/tasks/done/021-record-proxy-benchmark-baseline-output.md`
- `.agents/tasks/done/022-preserve-buffer-proxy-success-status.md`
- `.agents/tasks/done/023-add-package-local-verify-scripts.md`
- `.agents/tasks/done/024-improve-explorer-filtered-empty-state.md`
- `.agents/tasks/done/025-add-proxy-benchmark-compare-helper.md`
- `.agents/tasks/ready/026-preserve-buffer-proxy-204-empty-response.md`
- `.agents/tasks/ready/027-exclude-pending-logs-from-status-filters.md`
- `.agents/tasks/ready/028-add-proxy-benchmark-compare-tests.md`
- `.agents/tasks/ready/029-add-docs-package-verify-script.md`
- `.agents/tasks/ready/030-add-proxy-benchmark-overhead-ratios.md`

Exit criteria:

- public proxy status behavior has focused tests and required review
- package verification docs include package-local commands, including docs
- Explorer tests cover filtered-empty and pending status-filter behavior
- proxy benchmark JSON output, comparison tooling, and relative overhead fields
  are optional and artifact-safe
