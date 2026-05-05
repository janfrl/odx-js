# Next Action

This file tells the human/operator what to do next and gives the exact prompt
to paste into the next chat.

Update it after every completed implementation, review, planning, integration,
or workflow task.

## Current Mode

Adaptive Teamflow.

## Current Next Step

Implement `.agents/tasks/ready/048-document-package-verification-artifacts.md`.

Task 046 has concurrent Explorer changes in the worktree. Do not pick task 046
until that work is committed or otherwise resolved.

## Prompt For Next Chat

```txt
You are the Implementer for ODX in C:\Users\janfr\Documents\GitHub\2.bechtle\odx-js on branch codex/orchestrator-8h-analysis.

Read:
- AGENTS.md
- README.md
- CONTRIBUTING.md
- .agents/WORKFLOW.md
- .agents/decisions/
- .agents/tasks/ready/048-document-package-verification-artifacts.md
- docs/README.md
- packages/core/README.md
- packages/proxy/README.md
- packages/nuxt/README.md
- packages/explorer/README.md
- package.json
- .agents/tasks/done/044-add-aggregate-package-verification-script.md

Implement exactly `.agents/tasks/ready/048-document-package-verification-artifacts.md`.

Rules:
- Keep changes scoped to the task.
- Update documentation only where it improves discoverability of `pnpm.cmd run verify:packages`, package-local verify commands, and docs-generated API reference drift.
- Keep wording concise and close to existing package verification sections.
- Mention that `verify:packages` does not replace broad `lint`, `typecheck`, or workspace `test`.
- Do not change scripts, source code, generated docs artifacts, package behavior, examples, dependencies, lockfiles, or CI configuration.
- Do not touch Explorer task 046 files or other unrelated work already present in the worktree.
- Use `pnpm.cmd`, not `pnpm`, on this Windows machine because PowerShell blocks `.ps1` launchers.
- Do not revert edits made by others.
- Update the task handoff notes before finishing.
- Run the verification steps listed in the task, or explain why they could not be run.
- Self-check against scope, acceptance criteria, relevant docs/decisions, architecture boundaries, security/privacy implications, and unrelated changes.
- Decide whether separate review is required using `.agents/WORKFLOW.md`.
- Move the task to `.agents/tasks/done/` when implementation and verification are complete.
- Update `.agents/NEXT.md` with the next action and exact next-chat prompt.
- Commit the completed task with a Conventional Commit unless a stop condition prevents committing.

When done, summarize:
- changed files
- what was implemented
- verification performed
- self-check result
- whether separate review is required and why
- commit hash
- known gaps
- exact next-chat prompt from `.agents/NEXT.md`
```
