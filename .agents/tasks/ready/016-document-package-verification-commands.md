# Task: Document package verification commands

Status: ready
Owner: unassigned
Created: 2026-05-05
Risk: low
Review: optional

## Objective

Promote the new package-level verification commands from `.agents/` workflow
notes into durable package documentation.

## Context

Recent tasks added independent package checks:

- `pnpm.cmd run example:core`
- `pnpm.cmd run example:proxy`
- `pnpm.cmd run examples`
- `pnpm.cmd run bench:proxy`
- `pnpm.cmd --filter @bc8-odx/nuxt run playground:check`

The root/package READMEs are currently thin and do not mention these commands,
so humans cannot easily discover package isolation checks without reading
`.agents/`.

Relevant files:

- `README.md`
- `packages/core/README.md`
- `packages/proxy/README.md`
- `packages/nuxt/README.md`
- `package.json`
- `packages/nuxt/package.json`
- `examples/core-standalone.ts`
- `examples/proxy-standalone.ts`

## Scope

- Add concise documentation for the existing verification commands.
- Explain what each command proves at a high level.
- Mention that `pnpm.cmd` is needed on this Windows environment when relevant.
- Keep docs factual; do not add marketing copy or duplicate full API docs.

## Non-Goals

- Do not redesign documentation pages.
- Do not add new commands or tooling.
- Do not change examples, benchmarks, or package runtime behavior.

## Acceptance Criteria

- [ ] Core standalone example command is documented.
- [ ] Proxy standalone example and benchmark commands are documented.
- [ ] Nuxt minimal playground check is documented.
- [ ] Root README points to package-level verification options.
- [ ] Docs remain lint-clean.

## Verification

Task-local checks:

- `pnpm.cmd run lint`

Checkpoint or broad checks, if required:

- `pnpm.cmd run typecheck`

Setup/data prerequisites:

- Use `pnpm.cmd`, not `pnpm`, on this Windows machine because PowerShell blocks
  `.ps1` launchers.

If a check is skipped, record why and the residual risk in Handoff Notes.

## Risk Notes

Low risk because this is documentation-only for existing commands.

## Handoff Notes

To be completed by the implementer.
