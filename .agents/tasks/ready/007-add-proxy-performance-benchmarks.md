# Task: Add proxy performance benchmarks

Status: ready
Owner: unassigned
Created: 2026-05-05
Risk: medium
Review: conditional - required if production proxy behavior changes

## Objective

Add repeatable performance tests or benchmarks that measure ODX proxy overhead
between an app and a backend service.

## Context

ODX sits between application code and OData backends, so proxy overhead matters.
The goal is to create a baseline before optimizing. Benchmarks should be
stable, local, and useful for comparing future changes.

Relevant files:

- `packages/proxy/test/fixtures/backend.ts`
- `packages/proxy/test/fixtures/server.ts`
- `packages/proxy/src/api/odata.ts`
- `package.json`
- `vitest.config.ts`

## Scope

- Add a local benchmark or performance test for representative proxy paths.
- Compare at least direct backend request latency with proxied request latency
  against the same local fixture.
- Cover stream and buffer mode if practical.
- Keep assertions tolerant enough for local machines and CI variability.
- Document how to run the benchmark.

## Non-Goals

- Do not optimize proxy code in this task unless a severe, obvious issue blocks
  useful measurement.
- Do not introduce heavyweight external load-testing infrastructure.
- Do not depend on real SAP or network services.
- Do not make normal unit tests flaky with strict timing thresholds.

## Acceptance Criteria

- [ ] A contributor can run a local command to measure proxy overhead.
- [ ] The benchmark reports direct backend and proxied timings.
- [ ] Stream and buffer paths are distinguished or a follow-up is created.
- [ ] Normal `pnpm.cmd run test` remains stable.
- [ ] Any performance thresholds are justified and not brittle.

## Verification

Task-local checks:

- `<new benchmark command>`
- `pnpm.cmd run test -- packages/proxy`
- `pnpm.cmd run typecheck`

Checkpoint or broad checks, if required:

- `pnpm.cmd run lint`

Setup/data prerequisites:

- Use local fixture servers only.
- Use `pnpm.cmd`, not `pnpm`, on this Windows machine because PowerShell blocks
  `.ps1` launchers.

If a check is skipped, record why and the residual risk in Handoff Notes.

## Risk Notes

Medium risk because this adds tooling and may influence future performance
decisions. Separate review is required only if production proxy behavior is
changed.

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
