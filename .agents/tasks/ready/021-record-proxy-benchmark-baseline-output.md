# Task: Record proxy benchmark baseline output

Status: ready
Owner: unassigned
Created: 2026-05-05
Risk: medium
Review: conditional - required if production proxy behavior changes

## Objective

Make proxy benchmark runs easier to compare by emitting a small machine-readable
baseline summary alongside the existing console report.

## Context

Tasks 007 and 014 added `pnpm.cmd run bench:proxy` and expanded it to small,
large, concurrent, streamed, buffered, and DevTools-enabled scenarios. The
current benchmark is useful interactively, but future performance follow-ups
need a simple way to compare scenario names, iteration counts, and timings
without scraping human-oriented console output.

Relevant files:

- `packages/proxy/test/performance.test.ts`
- `package.json`
- `.agents/tasks/done/007-add-proxy-performance-benchmarks.md`
- `.agents/tasks/done/014-expand-proxy-performance-scenarios.md`

## Scope

- Add optional JSON output for the proxy benchmark summary.
- Keep the normal `pnpm.cmd run bench:proxy` console behavior intact.
- Prefer an environment variable such as `ODX_PROXY_BENCHMARK_OUTPUT` for the
  output path so normal test runs do not create files.
- Include scenario name, path/category, iterations/concurrency, average timing,
  and environment metadata needed to interpret a local run.
- Ensure generated benchmark output is not committed accidentally if it lives
  under a generated-artifact path.

## Non-Goals

- Do not add machine-specific performance budgets.
- Do not optimize proxy runtime code.
- Do not add external load-testing tools or dependencies.
- Do not make normal `pnpm.cmd run test` create benchmark artifacts.

## Acceptance Criteria

- [ ] `pnpm.cmd run bench:proxy` still prints the existing useful summary.
- [ ] Setting the benchmark output environment variable writes valid JSON.
- [ ] The JSON includes all benchmark scenarios currently reported in the
  console output.
- [ ] Normal skipped-by-default behavior remains stable for `pnpm.cmd run test`.
- [ ] Generated output path behavior is documented in code comments, README, or
  handoff notes as appropriate.

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

Medium risk because benchmark output shape can influence future performance
decisions. Separate review is required only if production proxy behavior,
runtime logging, or package scripts used by normal tests change materially.

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
