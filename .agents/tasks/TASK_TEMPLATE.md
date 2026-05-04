# Task: <short title>

Status: ready
Owner: unassigned
Created: YYYY-MM-DD
Risk: low | medium | high | critical
Review: not required | required | conditional - explain condition

## Objective

Describe the concrete outcome.

## Context

Reference relevant docs and explain why this task exists.

## Scope

Include:

- files or areas to change
- expected behavior
- interfaces or contracts involved
- expected write scope

## Non-Goals

List related work that must not be included in this task.

## Acceptance Criteria

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Verification

Task-local checks:

- `<focused test or lint command>`
- `<focused typecheck command>`
- For AI, prompt, ranking, routing, or workflow behavior: `<eval, fixture, or
  concrete scenario check>`

Checkpoint or broad checks, if required:

- `<full test command>`
- `<full typecheck command>`

Setup/data prerequisites:

- command or fixture required before verification, or `none`

If a check is skipped, record why and the residual risk in Handoff Notes.

## Risk Notes

Call out security, privacy, financial, compliance, deployment, or API risks.

Use the risk classifier in `.agents/WORKFLOW.md`. If this task is medium,
high, or critical risk, explain why the selected review requirement is safe.

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
