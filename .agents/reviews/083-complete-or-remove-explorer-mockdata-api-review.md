# Review: Complete or remove Explorer mockdata API

Status: complete
Date: 2026-05-08
Reviewer: Codex
Task: `.agents/tasks/done/083-complete-or-remove-explorer-mockdata-api.md`
Reviewed commit: `bb244e6e2b157161a1ba36d238d3677f953fa853`
Decision: approved

## Findings

None.

## Acceptance Criteria

- [x] Explorer no longer calls an unregistered `/__odx__/mockdata` endpoint:
  pass. The Explorer mock-data URL builder, shared state deletion action,
  entity clear action, and Data Browser Clear button were removed.
- [x] The chosen mock-data behavior is documented and tested: pass. English and
  German setup docs now state that local mock fixture files are managed directly
  in the development workspace, and the state test asserts that the deletion
  actions are not exposed.
- [x] Production behavior cannot delete arbitrary files or customer data: pass.
  No backend mock-data deletion handler was added, and the Explorer no longer
  exposes a call path that could delete server-side mock data.
- [x] Local development behavior remains clear: pass. The docs retain JSON
  export/offline fixture guidance and clarify that clearing mock files is a
  workspace file-management action, not an Explorer server action.

## Verification

Run or inspect:

- `git show --stat --oneline bb244e6e2b157161a1ba36d238d3677f953fa853` -
  reviewed changed file set.
- `git show --no-ext-diff --unified=80 --no-renames bb244e6e2b157161a1ba36d238d3677f953fa853 -- packages/explorer/composables/useODataState.ts packages/explorer/composables/useEntityExplorer.ts packages/explorer/components/entity/Toolbar.vue packages/explorer/test/state.test.ts docs/content/en/5.explorer/1.setup.md docs/content/de/5.explorer/1.setup.md .agents/tasks/done/083-complete-or-remove-explorer-mockdata-api.md` -
  reviewed.
- `packages/proxy/src/nitro.ts` and `packages/proxy/src/api/*` - inspected;
  no `/__odx__/mockdata` handler was added and normal OData proxy handler
  registration is unchanged.
- `git grep -n -E "mockdata|mock-data|clearEntityMockData|clearData|/__odx__/mockdata" -- packages docs .agents` -
  pass for source/runtime callers. Remaining mentions are documentation,
  historical task/review/decision notes, and the new removal test.
- `git diff --check HEAD~1..HEAD` - pass.
- Implementer verification accepted: `pnpm.cmd --filter @bc8-odx/explorer run
  verify`, `pnpm.cmd --filter @bc8-odx/proxy run verify`, `pnpm.cmd run lint`,
  and `pnpm.cmd run typecheck` passed per task handoff notes.

## Residual Risk

- No live SAP BTP/AppRouter smoke test was performed. This is acceptable for
  task 083 because the reviewed change removes an unregistered Explorer action
  and does not alter deployed proxy routing.

## Open Questions

- None.

## Test Gaps

- None blocking. The focused state test covers the chosen removal behavior.

## Summary

Task 083 resolves the Explorer/backend mismatch by removing the client-side
mock-data clear surface instead of introducing a server-side deletion API. The
change stays within Explorer state/UI, tests, docs, and task workflow files; it
does not change normal OData proxy behavior or add a production deletion path.

## Next Action

- `.agents/NEXT.md` was updated to start task 085 implementation.
- Follow-up task or fix required: none for task 083.
