# Next Action

This file tells the human/operator what to do next and gives the exact prompt
to paste into the next chat.

Update it after every completed implementation, review, planning, integration,
or workflow task.

## Current Mode

Adaptive Teamflow.

## Current Next Step

Implement `.agents/tasks/ready/074-reject-duplicate-benchmark-output-scenarios.md`.

## Prompt For Next Chat

```txt
You are the Implementer for ODX in C:\Users\janfr\Documents\GitHub\2.bechtle\odx-js on branch codex/orchestrator-8h-analysis.

Read:
- AGENTS.md
- README.md
- CONTRIBUTING.md
- .agents/WORKFLOW.md
- .agents/decisions/
- .agents/tasks/ready/074-reject-duplicate-benchmark-output-scenarios.md
- .agents/tasks/done/047-reject-duplicate-benchmark-scenarios.md
- .agents/tasks/done/064-reject-malformed-benchmark-report-timing-fields.md
- .agents/tasks/done/068-validate-benchmark-count-fields.md
- packages/proxy/test/benchmark-report.ts
- packages/proxy/test/benchmark-report.test.ts

Implement exactly `.agents/tasks/ready/074-reject-duplicate-benchmark-output-scenarios.md`.

Rules:
- Keep changes scoped to benchmark report creation validation and focused tests.
- Add failing tests first for duplicate scenario labels in `formatBenchmarkReport()` and `createBenchmarkOutput()`.
- Reject duplicate labels with an error naming the repeated scenario label.
- Preserve valid report formatting, JSON output shape, category derivation, timing validation, count validation, and overhead fields.
- Do not change benchmark scenario definitions, timing measurement loops, comparison tooling, production proxy runtime behavior, package scripts, dependencies, lockfiles, or generated files.
- Update the task handoff notes before finishing.
- Run the verification steps listed in the task, or explain why they could not be run.
- Decide whether separate review is required using .agents/WORKFLOW.md and the task risk notes.
- Move the task to .agents/tasks/done/ when implementation and verification are complete.
- Update .agents/NEXT.md with the next workflow action and exact next-chat prompt.
- Commit the completed task with a Conventional Commit unless a stop condition prevents committing.

When done, summarize:
- changed files
- what was implemented
- verification performed
- self-check result
- whether separate review is required and why
- commit hash
- known gaps
- exact next-chat prompt from .agents/NEXT.md
```
