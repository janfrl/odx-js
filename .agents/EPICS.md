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
- `.agents/tasks/done/026-preserve-buffer-proxy-204-empty-response.md`
- `.agents/tasks/done/028-add-proxy-benchmark-compare-tests.md`
- `.agents/tasks/done/030-add-proxy-benchmark-overhead-ratios.md`
- `.agents/tasks/done/032-validate-btp-destination-url.md`
- `.agents/tasks/done/034-add-proxy-benchmark-report-metadata.md`
- `.agents/tasks/done/037-reject-non-http-btp-destination-url.md`
- `.agents/tasks/done/039-report-missing-benchmark-scenarios.md`
- `.agents/tasks/done/042-normalize-proxy-basepath-parsing.md`
- `.agents/tasks/done/043-test-proxy-benchmark-report-formatting.md`

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
- `.agents/tasks/done/027-exclude-pending-logs-from-status-filters.md`
- `.agents/tasks/done/029-add-docs-package-verify-script.md`
- `.agents/tasks/done/031-include-core-tests-in-package-verify.md`
- `.agents/tasks/done/033-harden-explorer-proxy-trace-selection-state.md`
- `.agents/tasks/done/035-add-docs-package-readme-verification-notes.md`
- `.agents/tasks/done/036-normalize-nuxt-service-url-joins.md`
- `.agents/tasks/done/038-clear-stale-explorer-entity-selection.md`
- `.agents/tasks/done/040-cover-routed-nuxt-mutations.md`
- `.agents/tasks/done/044-add-aggregate-package-verification-script.md`
- `.agents/tasks/done/045-clear-stale-explorer-log-service-filter.md`

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
- `.agents/tasks/done/026-preserve-buffer-proxy-204-empty-response.md`
- `.agents/tasks/done/027-exclude-pending-logs-from-status-filters.md`
- `.agents/tasks/done/028-add-proxy-benchmark-compare-tests.md`
- `.agents/tasks/done/029-add-docs-package-verify-script.md`
- `.agents/tasks/done/030-add-proxy-benchmark-overhead-ratios.md`
- `.agents/tasks/done/031-include-core-tests-in-package-verify.md`
- `.agents/tasks/done/032-validate-btp-destination-url.md`
- `.agents/tasks/done/033-harden-explorer-proxy-trace-selection-state.md`
- `.agents/tasks/done/034-add-proxy-benchmark-report-metadata.md`
- `.agents/tasks/done/035-add-docs-package-readme-verification-notes.md`
- `.agents/tasks/done/036-normalize-nuxt-service-url-joins.md`
- `.agents/tasks/done/037-reject-non-http-btp-destination-url.md`
- `.agents/tasks/done/038-clear-stale-explorer-entity-selection.md`
- `.agents/tasks/done/039-report-missing-benchmark-scenarios.md`
- `.agents/tasks/done/040-cover-routed-nuxt-mutations.md`
- `.agents/tasks/done/041-preserve-flattened-value-properties.md`
- `.agents/tasks/done/042-normalize-proxy-basepath-parsing.md`
- `.agents/tasks/done/043-test-proxy-benchmark-report-formatting.md`
- `.agents/tasks/done/044-add-aggregate-package-verification-script.md`
- `.agents/tasks/done/045-clear-stale-explorer-log-service-filter.md`

Exit criteria:

- public proxy status behavior has focused tests and required review
- package verification docs include package-local commands, including docs
- Explorer tests cover filtered-empty and pending status-filter behavior
- proxy benchmark JSON output, comparison tooling, and relative overhead fields
  are optional and artifact-safe
- destination payload validation fails clearly for malformed BTP targets
- benchmark reports include enough local run metadata for fair comparisons
- Nuxt composable URL construction is covered for slashed config boundaries
- benchmark comparison output calls out scenario mismatches

## Epic 07: Core Stability And Package Verification Tightening

Goal: close small correctness gaps while keeping isolated package verification
easy to run.

Deliverables:

- Core flattening preserves ordinary entity fields whose names overlap OData
  envelope keys.
- Proxy request parsing handles base-path slash boundaries consistently.
- Benchmark report formatting has fast deterministic tests.
- Package-local verify scripts can be run together through one root command.
- Explorer config-backed filters reconcile after service config refresh.

Candidate tasks:

- `.agents/tasks/done/041-preserve-flattened-value-properties.md`
- `.agents/tasks/done/042-normalize-proxy-basepath-parsing.md`
- `.agents/tasks/done/043-test-proxy-benchmark-report-formatting.md`
- `.agents/tasks/done/044-add-aggregate-package-verification-script.md`
- `.agents/tasks/done/045-clear-stale-explorer-log-service-filter.md`

Exit criteria:

- The ready task queue completes with task-local checks passing.
- No UI churn is introduced without explicit browser verification.
- Broad checkpoint checks are run or residual risk is recorded.

## Epic 08: Endpoint Encoding And Checkpoint Confidence

Goal: close the verified Explorer endpoint encoding bug and keep verification
outputs trustworthy before broader optimization work.

Deliverables:

- Explorer internal endpoint calls encode service and entity query values.
- Proxy benchmark comparison rejects malformed reports with duplicate scenario
  labels.
- Package verification documentation explains the aggregate command and docs
  artifact drift.
- A release confidence checkpoint records package and workspace check results.

Candidate tasks:

- `.agents/tasks/done/046-encode-explorer-internal-endpoint-params.md`
- `.agents/tasks/done/047-reject-duplicate-benchmark-scenarios.md`
- `.agents/tasks/done/048-document-package-verification-artifacts.md`
- `.agents/tasks/done/049-run-release-confidence-checkpoint.md`

Exit criteria:

- The ready task queue completes with task-local checks passing.
- The Explorer endpoint encoding regression is covered without UI redesign.
- Benchmark comparison validation has deterministic tests.
- The checkpoint either passes or records bounded failures and residual risk.

## Epic 09: Stability And Deployment Verification Polish

Goal: tighten the next small stability and verification gaps after the release
confidence checkpoint without starting broad runtime optimization or UI work.

Deliverables:

- Explorer entity preview cache state stays isolated for service/entity names
  containing separator characters.
- Deployment route/destination configuration has deterministic local
  consistency coverage.
- Proxy benchmark comparison rejects malformed timing fields before reporting
  deltas.
- Generated metadata cache cleanup expectations are documented in existing
  contributor-facing docs.

Candidate tasks:

- `.agents/tasks/done/050-isolate-explorer-entity-cache-keys.md`
- `.agents/tasks/done/051-add-deployment-config-consistency-tests.md`
- `.agents/tasks/done/052-validate-benchmark-comparison-timing-fields.md`
- `.agents/tasks/done/053-document-generated-metadata-cache-cleanup.md`

Exit criteria:

- The ready task queue completes with task-local checks passing.
- Required review is completed for deployment configuration verification.
- No UI redesign or browser-mode work is introduced without a dedicated task
  and a port `3000` verification plan.
- Broad checkpoint checks are run or residual risk is recorded after the queue
  completes.

## Epic 10: Falsy Payload And Metadata Download Tightening

Goal: close high-confidence stability candidates from read-only exploration
with small test-first changes before broader optimization work.

Deliverables:

- Proxy benchmark concurrency env validation rejects invalid values before
  timing loops can hang or misreport.
- Nuxt metadata generation downloads from `http://` services with the correct
  Node client while preserving HTTPS behavior.
- Core OData flattening unwraps proven falsy V2 `d` payloads without
  collapsing ordinary entity properties named `d`.
- A checkpoint records package and workspace verification after the queue.

Candidate tasks:

- `.agents/tasks/ready/054-validate-benchmark-concurrency-env.md`
- `.agents/tasks/ready/055-use-http-client-for-nuxt-metadata-downloads.md`
- `.agents/tasks/ready/056-unwrap-falsy-v2-d-payloads.md`
- `.agents/tasks/ready/057-run-stability-checkpoint.md`

Exit criteria:

- The ready task queue completes with task-local checks passing.
- No UI redesign or browser-mode work is introduced.
- Broad checkpoint checks are run or residual risk is recorded after the queue
  completes.

## Epic 11: Registry And Hook Contract Tightening

Goal: close small generated-type and hook-contract gaps without broad runtime
redesign or ambiguous stream-mode behavior changes.

Deliverables:

- Generated Nuxt registry declarations remain valid for service names that are
  not TypeScript identifiers.
- Buffered proxy response hooks call the typed service-specific hook and await
  async hook work.
- Proxy benchmark iteration and round env parsing fails fast for invalid loop
  controls.
- Nuxt package docs explain how non-identifier service names are represented in
  generated registry types after the implementation lands.
- A checkpoint records package and workspace verification plus required review
  state after the queue.

Candidate tasks:

- `.agents/tasks/ready/058-quote-generated-registry-service-keys.md`
- `.agents/tasks/ready/059-cover-buffered-service-specific-response-hooks.md`
- `.agents/tasks/ready/060-validate-benchmark-iteration-env.md`
- `.agents/tasks/ready/061-document-service-name-type-generation-limits.md`
- `.agents/tasks/ready/062-run-stability-and-hooks-checkpoint.md`

Exit criteria:

- The ready task queue completes with task-local checks passing.
- Required independent review is completed for the proxy hook-contract change.
- Stream proxy response-hook behavior is not changed until its expected
  contract is clarified in docs or tests.
- Broad checkpoint checks are run or residual risk is recorded after the queue
  completes.

## Epic 12: Production Explorer Runtime

Goal: make the standalone Explorer work as an authenticated deployed runtime
tool without treating TypeScript SDK generation or local `.nuxt` state as
production behavior.

Deliverables:

- `/__odx__` production endpoint policy is explicit and reviewed.
- Production config responses are sanitized.
- Development and production Explorer runtime differences are documented in
  durable and user-facing docs.
- Explorer traffic logs use a redacted ODX log store abstraction.
- db0 is available as the first persistent log store backend.
- Runtime metadata refresh is separated from TypeScript SDK generation.
- Schema/config endpoints read from runtime metadata cache state.
- Standalone Explorer UI reflects Refresh Metadata versus Regenerate SDK
  semantics.
- The mockdata endpoint/UI mismatch is resolved.

Candidate tasks:

- `.agents/tasks/done/077-harden-production-explorer-endpoints-and-config.md`
- `.agents/tasks/ready/084-document-dev-prod-explorer-runtime-differences.md`
- `.agents/tasks/ready/078-introduce-odx-log-store-and-redaction.md`
- `.agents/tasks/ready/079-add-db0-backed-explorer-log-store.md`
- `.agents/tasks/ready/080-separate-runtime-metadata-refresh-from-sdk-generation.md`
- `.agents/tasks/ready/081-use-runtime-metadata-cache-for-schema-and-config.md`
- `.agents/tasks/ready/082-align-standalone-explorer-runtime-ui.md`
- `.agents/tasks/ready/083-complete-or-remove-explorer-mockdata-api.md`

Exit criteria:

- Secure Teamflow review notes exist for high-risk endpoint, logging,
  persistence, and metadata-refresh tasks.
- Production Explorer runtime APIs do not leak secrets or unredacted payloads.
- BTP deployment docs describe the database/logging and metadata-refresh
  expectations.
- TypeScript SDK generation remains a development/build/CI concern.
