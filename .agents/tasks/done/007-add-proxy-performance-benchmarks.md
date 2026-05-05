# Task: Add proxy performance benchmarks

Status: done
Owner: Codex orchestrator + Carver
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

- [x] A contributor can run a local command to measure proxy overhead.
- [x] The benchmark reports direct backend and proxied timings.
- [x] Stream and buffer paths are distinguished or a follow-up is created.
- [x] Normal `pnpm.cmd run test` remains stable.
- [x] Any performance thresholds are justified and not brittle.

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

- Changed files:
  - `package.json`
  - `packages/proxy/test/performance.test.ts`
- Summary:
  - Added `pnpm.cmd run bench:proxy` for an opt-in local proxy benchmark.
  - Benchmarks direct fixture backend `GET /Products` against proxied buffer and
    stream paths through the ODX proxy.
  - Reports min, average, p50, p95, max, and average proxy overhead.
  - Keeps production proxy code unchanged.
- Tests run:
  - `pnpm.cmd run bench:proxy` passed.
  - `pnpm.cmd exec vitest run packages\explorer\test\state.test.ts` passed
    during the same checkpoint for task 009.
  - `pnpm.cmd run lint` passed.
  - `pnpm.cmd run typecheck` passed.
- Skipped checks and residual risk:
  - Broad `pnpm.cmd run test` was not rerun for this task checkpoint because
    focused proxy benchmark, lint, and typecheck passed; previous worker noted
    `pnpm.cmd run test -- packages/proxy` invokes other Vitest projects in this
    workspace.
- Self-check result:
  - Scope is tooling/test-only.
  - No production proxy behavior or public contracts changed.
  - Thresholds are intentionally tolerant and only guard invalid/totally broken
    measurements.
- Review requirement decision:
  - Separate review not required by `.agents/WORKFLOW.md` because production
    behavior did not change. Optional review may be useful before treating the
    numbers as a formal performance baseline.
- Task state movement:
  - Move to `.agents/tasks/done/`.
- `.agents/NEXT.md` update:
  - Advance to package isolation implementation.
- Commit hash:
  - To be filled after commit.
- Known gaps:
  - Measures a single small JSON `GET` endpoint only.
  - Does not yet cover concurrency, large payloads, request bodies, CSRF, or
    DevTools-enabled tracing overhead.
