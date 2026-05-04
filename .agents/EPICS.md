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

- `.agents/tasks/ready/001-restore-lint-baseline.md`

Exit criteria:

- `pnpm.cmd run lint`, `pnpm.cmd run typecheck`, and `pnpm.cmd run test` pass or
  have documented residual risk

## Epic 02: Proxy Security And Policy Hardening

Goal: reduce risk around DevTools telemetry and proxy rule enforcement.

Deliverables:

- sensitive headers are redacted before traffic logs are stored
- async custom validation cannot accidentally allow a blocked proxy request
- high-risk proxy changes receive independent review

Candidate tasks:

- `.agents/tasks/ready/002-redact-devtools-sensitive-headers.md`
- `.agents/tasks/ready/003-await-async-rule-validation.md`

Exit criteria:

- focused proxy tests cover the fixed behavior
- required review notes exist for high-risk changes

## Epic 03: Nuxt Generation And Composable Correctness

Goal: make setup-time type generation and public composable URL construction
more robust.

Deliverables:

- `odata2ts` is invoked without shell-string command construction
- OData string keys are escaped correctly in generated request URLs
- existing registry augmentation behavior remains intact

Candidate tasks:

- `.agents/tasks/ready/004-harden-type-generation-process-exec.md`
- `.agents/tasks/ready/005-escape-odata-key-literals.md`

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

- `.agents/tasks/ready/006-finish-agent-workflow-adoption.md`

Exit criteria:

- the next chat can resume from repository state without template-adoption
  ambiguity
