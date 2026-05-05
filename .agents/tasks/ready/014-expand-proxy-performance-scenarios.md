# Task: Expand proxy performance scenarios

Status: ready
Owner: unassigned
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

- [ ] `pnpm.cmd run bench:proxy` reports small and larger payload scenarios.
- [ ] Benchmark output distinguishes sequential and bounded-concurrency runs.
- [ ] Stream and buffer modes remain separated.
- [ ] Normal skipped-by-default behavior remains stable for `pnpm.cmd run test`.
- [ ] Known measurement limitations are recorded in handoff notes.

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

To be completed by the implementer.
