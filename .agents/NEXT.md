# Next Action

This file tells the human/operator what to do next and gives the exact prompt
to paste into the next chat.

Update it after every completed implementation, review, planning, integration,
or workflow task.

## Current Mode

Adaptive Teamflow.

## Current Next Step

Implement next ready task:
`.agents/tasks/ready/044-add-aggregate-package-verification-script.md`.

## Prompt For Next Chat

```txt
You are the Implementer for ODX in C:\Users\janfr\Documents\GitHub\2.bechtle\odx-js on branch codex/orchestrator-8h-analysis.

Read:
- AGENTS.md
- README.md
- CONTRIBUTING.md
- .agents/WORKFLOW.md
- .agents/decisions/
- .agents/tasks/ready/044-add-aggregate-package-verification-script.md
- package.json
- packages/core/package.json
- packages/proxy/package.json
- packages/nuxt/package.json
- packages/explorer/package.json
- docs/package.json
- .agents/PACKAGE_ISOLATION.md
- .agents/tasks/done/023-add-package-local-verify-scripts.md
- .agents/tasks/done/029-add-docs-package-verify-script.md
- .agents/tasks/done/031-include-core-tests-in-package-verify.md

Implement exactly `.agents/tasks/ready/044-add-aggregate-package-verification-script.md`.

Rules:
- Keep changes scoped to the root aggregate package verification script and README guidance if needed.
- Do not change individual package `verify` scripts unless a mechanical script-name adjustment is strictly required.
- Do not replace `lint`, `typecheck`, or workspace `test`; do not add dependencies, CI config, runtime code, or lockfile changes.
- Do not revert edits made by others.
- Update task handoff notes, move the task to `.agents/tasks/done/` when complete, update `.agents/NEXT.md`, and commit with a Conventional Commit unless a stop condition prevents committing.

Verification:
- `pnpm.cmd run verify:packages`
- `pnpm.cmd run lint`
- `pnpm.cmd run typecheck` if required by blast radius

When done, summarize:
- changed files
- what was implemented
- verification performed
- whether separate review is required and why
- commit hash
- exact next-chat prompt from `.agents/NEXT.md`
```
