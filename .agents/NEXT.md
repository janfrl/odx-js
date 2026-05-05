# Next Action

This file tells the human/operator what to do next and gives the exact prompt
to paste into the next chat.

Update it after every completed implementation, review, planning, integration,
or workflow task.

## Current Mode

Adaptive Teamflow.

## Current Next Step

Run Implementer on
`.agents/tasks/ready/072-run-post-runtime-optimization-checkpoint.md`.

## Prompt For Next Chat

```txt
You are the Implementer for ODX in C:\Users\janfr\Documents\GitHub\2.bechtle\odx-js.

Read:
- AGENTS.md
- README.md
- CONTRIBUTING.md
- .agents/WORKFLOW.md
- .agents/decisions/
- .agents/tasks/ready/072-run-post-runtime-optimization-checkpoint.md
- .agents/tasks/done/067-encode-explorer-delete-item-id.md
- .agents/tasks/done/068-validate-benchmark-count-fields.md
- .agents/tasks/done/069-warn-on-benchmark-comparison-metadata-mismatches.md
- .agents/tasks/done/070-test-deterministic-benchmark-summary-math.md
- .agents/tasks/done/071-skip-devtools-trace-allocation-when-disabled.md
- .agents/reviews/071-skip-devtools-trace-allocation-when-disabled-review.md

Implement exactly .agents/tasks/ready/072-run-post-runtime-optimization-checkpoint.md.

Rules:
- Keep changes scoped to .agents workflow state.
- Do not modify production source/tests/docs outside .agents, dependencies, lockfiles, or generated files.
- Run the verification steps listed in the task, or explain why they could not be run.
- Self-check against scope, acceptance criteria, relevant docs/decisions, architecture boundaries, security/privacy implications, and unrelated changes.
- Decide whether separate review is required using .agents/WORKFLOW.md.
- Move the task to .agents/tasks/done/ when implementation and verification are complete.
- Update .agents/NEXT.md with the next action and exact next-chat prompt.
- Commit the completed task with a Conventional Commit unless a stop condition prevents committing.

When done, summarize:
- changed files
- what was verified
- self-check result
- whether separate review is required and why
- commit hash
- known gaps
- exact next-chat prompt from .agents/NEXT.md
```
