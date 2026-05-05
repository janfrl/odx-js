# Task: Expand proxy performance scenarios

Status: done
Owner: Aquinas + Codex orchestrator
Created: 2026-05-05
Risk: medium
Review: conditional - required if production proxy behavior changes

## Objective

Broaden the proxy benchmark baseline so it captures more realistic overhead
than a single small `GET`.

## Context

Task 007 added `pnpm.cmd run bench:proxy` for direct vs proxied buffer/stream
small JSON `GET` requests. ODX sits between application code and OData
backends, so future optimization needs coverage for payload size, concurrency,
and optional DevTools tracing overhead.

Relevant files:

- `packages/proxy/test/performance.test.ts`
- `packages/proxy/test/fixtures/backend.ts`
- `packages/proxy/test/fixtures/server.ts`
- `packages/proxy/src/api/odata.ts`
- `package.json`

## Scope

- Add at least one larger local fixture response to the benchmark.
- Add a bounded concurrency scenario that compares direct, buffer, and stream
  paths.
- Measure DevTools-enabled tracing overhead separately if practical without
  making the normal test suite flaky.
- Keep benchmark assertions tolerant and aimed at detecting invalid
  measurements, not enforcing machine-specific latency budgets.

## Non-Goals

- Do not optimize proxy code in this task unless a severe, obvious measurement
  blocker is found.
- Do not add external load-testing infrastructure.
- Do not depend on real SAP/BTP/network services.

## Acceptance Criteria

- [x] `pnpm.cmd run bench:proxy` reports small and larger payload scenarios.
- [x] Benchmark output distinguishes sequential and bounded-concurrency runs.
- [x] Stream and buffer modes remain separated.
- [x] Normal skipped-by-default behavior remains stable for `pnpm.cmd run test`.
- [x] Known measurement limitations are recorded in handoff notes.

## Verification

Task-local checks:

- `pnpm.cmd run bench:proxy`
- `pnpm.cmd exec vitest run packages/proxy/test/performance.test.ts`
- `pnpm.cmd run typecheck`

Checkpoint or broad checks, if required:

- `pnpm.cmd run lint`

Setup/data prerequisites:

- Use local fixture servers only.
- Use `pnpm.cmd`, not `pnpm`, on this Windows machine because PowerShell blocks
  `.ps1` launchers.

If a check is skipped, record why and the residual risk in Handoff Notes.

## Risk Notes

Medium risk because benchmark design can mislead future optimization work.
Separate review is required only if production proxy behavior changes.

## Handoff Notes

Implemented in scoped test/fixture files only; no production proxy behavior was changed.

Added `/LargeProducts` to the local proxy backend fixture with 500 deterministic
OData-style rows so the benchmark has a larger JSON response without external
services.

Expanded `packages/proxy/test/performance.test.ts` to report:

- small sequential direct, buffer, and stream `GET /Products`
- large sequential direct, buffer, and stream `GET /LargeProducts`
- large bounded-concurrency direct, buffer, and stream `GET /LargeProducts`
  with default concurrency `5`, overrideable via
  `ODX_PROXY_BENCHMARK_CONCURRENCY`
- small sequential DevTools-enabled buffer tracing as a separate proxy/server
  path

Known measurement limitations:

- Local loopback microbenchmarks are noisy; average overhead can be negative on
  fast runs due to scheduling and request timing variance.
- Assertions intentionally validate finite timings and broad upper bounds only;
  they do not enforce machine-specific latency budgets.
- The concurrent scenario records per-request elapsed time while requests run in
  fixed-size batches, not full load-test throughput.

Verification run on 2026-05-05:

- `pnpm.cmd exec vitest run packages/proxy/test/performance.test.ts` - passed
  with benchmark suite skipped by default.
- `pnpm.cmd run bench:proxy` - passed and printed small, large, concurrent,
  buffer, stream, and DevTools-buffer rows.
- `pnpm.cmd run typecheck` - passed.
- `pnpm.cmd run test` - passed: 16 files passed, 1 skipped; 103 tests passed,
  1 skipped.
- `pnpm.cmd run lint` - passed after fixing one local benchmark helper style
  issue.
- Orchestrator re-ran `pnpm.cmd run bench:proxy`, `pnpm.cmd exec vitest run
  packages/proxy/test/performance.test.ts`, `pnpm.cmd exec vitest run
  packages/proxy/test/btp-destination.test.ts packages/proxy/test/performance.test.ts`,
  `pnpm.cmd run lint`, and `pnpm.cmd run typecheck` before moving the task to
  done.
- Commit hash:
  - To be filled after commit.
