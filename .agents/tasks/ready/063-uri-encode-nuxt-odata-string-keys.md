# Task: URI-encode Nuxt OData string keys

Status: ready
Owner: unassigned
Created: 2026-05-05
Risk: medium
Review: conditional - required if public composable URL behavior changes beyond key-literal encoding

## Objective

Make Nuxt OData composable helpers encode string key literals before they are
placed into request URLs so special characters in entity keys are routed as
data, not as path or query syntax.

## Context

The Nuxt runtime composable builds entity URLs for reads and mutations. String
keys such as `A/B?x=1&R` can contain characters that have URI meaning. These
keys should reach the OData endpoint as encoded key literal content.

This follows the stability queue after tasks 058-062. Task 058 made generated
registry declarations valid for non-identifier service names; this task is a
separate runtime URL correctness issue and must not duplicate registry
generation work.

Relevant docs and files:

- `AGENTS.md`
- `README.md`
- `CONTRIBUTING.md`
- `.agents/WORKFLOW.md`
- `.agents/tasks/done/058-quote-generated-registry-service-keys.md`
- `packages/nuxt/src/runtime/composables/useOData.ts`
- `packages/nuxt/test/composables.test.ts`

## Scope

- Add failing tests first for string-key URL construction with a key such as
  `A/B?x=1&R`.
- Cover `get()` for a single string key.
- Cover composite keys containing string members that need URI encoding.
- Cover routed mutation helpers for string keys, such as update, patch, or
  remove/delete, using the helper names already present in the composable test
  suite.
- Encode only OData key literal content before composing the URL path.
- Preserve existing behavior for numeric keys, simple string keys, entity-set
  paths, service routes, query option serialization, request payloads, and
  response handling.
- Keep changes inside the Nuxt package runtime composable and focused tests
  unless nearby helper extraction is clearly smaller and package-local.

## Non-Goals

- Do not change service configuration shape, generated registry declarations,
  metadata generation, proxy behavior, Explorer endpoints, package scripts,
  dependencies, lockfiles, or generated files.
- Do not redesign query serialization or route joining outside the key literal
  bug.
- Do not add browser or playground verification unless the implementation
  changes visible Nuxt playground behavior.

## Acceptance Criteria

- [ ] A focused test fails before implementation for `get('A/B?x=1&R')` or the
  equivalent existing API shape.
- [ ] String key literals are URI-encoded in generated request URLs.
- [ ] Composite key string members are URI-encoded without changing key names or
  separators.
- [ ] Routed mutation helper URLs encode string key literals.
- [ ] Existing composable tests and Nuxt package verification remain green.

## Verification

Task-local checks:

- `pnpm.cmd --filter @bc8-odx/nuxt exec vitest run test/composables.test.ts`
- `pnpm.cmd --filter @bc8-odx/nuxt run verify`
- `pnpm.cmd run typecheck`
- `pnpm.cmd run lint`

Checkpoint or broad checks, if required:

- none unless the implementation broadens beyond Nuxt composable URL
  construction

Setup/data prerequisites:

- Use deterministic composable tests and local test fixtures only.
- Use `pnpm.cmd`, not `pnpm`, on this Windows machine because PowerShell blocks
  `.ps1` launchers.

If a check is skipped, record why and the residual risk in Handoff Notes.

## Risk Notes

Medium risk because Nuxt composable URL construction is public runtime
behavior. Separate review is not required if the change is narrowly limited to
encoding key literal content with focused tests and does not alter service
routes, query serialization, generated types, proxy behavior, or broader URL
joining semantics.

If the implementation changes general URL composition, query option
serialization, public helper signatures, or generated output, require an
independent review before continuing.

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

