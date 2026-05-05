# Review: Add deployment config consistency tests

Status: complete
Date: 2026-05-05
Reviewer: independent Reviewer
Task: `.agents/tasks/done/051-add-deployment-config-consistency-tests.md`
Reviewed commit: `ad8c3cb527ce68084f8eb70018160b76d6e5eac2`
Decision: approved

## Findings

None.

## Acceptance Criteria

- [x] Local verification fails clearly if an AppRouter route destination is not provided by `mta.yaml`: pass.
- [x] Current `mta.yaml` and `packages/approuter/xs-app.json` pass the check: pass.
- [x] The check is discoverable through a package-local or root verification command: pass.
- [x] No deployment behavior changes are made unless required to fix a proven mismatch: pass.
- [x] Separate review is requested after implementation: pass.

## Verification

- `git show --find-renames --find-copies --stat --patch --format=fuller ad8c3cb` - pass, reviewed the task-scoped commit diff.
- Manual inspection of `packages/approuter/test/deployment-config.test.ts` - pass, the test reads checked-in `xs-app.json` and `mta.yaml`, extracts `odx-approuter` module destinations, and reports missing route destinations with destination/source objects.
- Manual inspection of `mta.yaml` and `packages/approuter/xs-app.json` - pass, route destinations `odx-proxy-backend` and `odx-explorer-ui` are provided by `odx-approuter` destination entries.
- Manual inspection of `package.json`, `packages/approuter/package.json`, `README.md`, and `DEPLOYMENT.md` - pass, the check is exposed through `pnpm.cmd --filter odx-approuter run verify` and included in `verify:packages` documentation.
- `pnpm.cmd exec vitest run packages/approuter/test/deployment-config.test.ts` - pass, 1 test.
- `pnpm.cmd --filter odx-approuter run verify` - pass, 1 test.

## Residual Risk

- The MTA inspection is intentionally narrow and indentation-sensitive instead of a full YAML parser. This matches the task constraint to avoid broad YAML tooling, but future major MTA formatting changes may require updating the extractor.
- During review, broader `lint`, `typecheck`, `test`, and `verify:packages` checks were not rerun. The implementer recorded them passing, and the reviewer reran the focused AppRouter checks.

## Open Questions

None.

## Test Gaps

None identified for the scoped invariant that AppRouter route destinations must be provided by the `odx-approuter` MTA module destination entries.

## Summary

The implementation adds deterministic local coverage for AppRouter-to-MTA destination consistency without changing deployment routes, authentication, service bindings, dependencies, or runtime behavior. The documentation and scripts make the new check discoverable.

## Next Action

- `.agents/NEXT.md` was updated to the next ready Implementer prompt for `.agents/tasks/ready/052-validate-benchmark-comparison-timing-fields.md`.
- Follow-up task or fix required: none for task 051.
