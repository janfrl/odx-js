# Task: Document service name type generation limits

Status: ready
Owner: unassigned
Created: 2026-05-05
Risk: low
Review: not required

## Objective

Clarify the current service-name constraints and generated type behavior in
existing Nuxt package documentation after the registry declaration fix lands.

## Context

The Nuxt type-generation path uses configured service names in generated
registry declarations, metadata cache files, output folders, and runtime
`useOData()` calls. After task 058 makes registry declarations tolerate
non-identifier service names, contributor-facing docs should explain the
supported behavior and any remaining practical limits without turning this
into a broad API redesign.

Relevant docs and files:

- `AGENTS.md`
- `CONTRIBUTING.md`
- `.agents/WORKFLOW.md`
- `.agents/tasks/ready/058-quote-generated-registry-service-keys.md`
- `packages/nuxt/README.md`
- `README.md`
- `API.md`

## Scope

- Update existing documentation, preferably `packages/nuxt/README.md`, with a
  narrow note about generated registry keys preserving configured service
  names.
- Mention bracket notation or `useOData('service name')` when service names are
  not legal TypeScript identifiers, if that matches the implementation from
  task 058.
- Document any remaining unsupported or discouraged service-name characters
  only if they are confirmed by existing implementation constraints.
- Keep wording concise and contributor-facing.

## Non-Goals

- Do not change source code, tests, generated output, runtime behavior, package
  scripts, dependencies, or lockfiles.
- Do not invent new service naming rules that are not enforced by code.
- Do not update root API or architecture docs unless the implementation changes
  a durable public contract that belongs there.

## Acceptance Criteria

- [ ] Documentation accurately reflects the behavior implemented by task 058.
- [ ] The note explains how to access non-identifier service names in typed
  code.
- [ ] Remaining limits, if any, are stated as current constraints rather than
  future promises.
- [ ] No source code or test changes are included.

## Verification

Task-local checks:

- Review the diff against task 058 implementation.
- `pnpm.cmd run lint`

Checkpoint or broad checks, if required:

- none

Setup/data prerequisites:

- Run only after task 058 is completed.
- Use `pnpm.cmd`, not `pnpm`, on this Windows machine because PowerShell blocks
  `.ps1` launchers.

If a check is skipped, record why and the residual risk in Handoff Notes.

## Risk Notes

Low risk because this is a narrow documentation update. Separate review is not
required unless the task uncovers an undocumented public contract change or
conflicting service-name behavior.

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

