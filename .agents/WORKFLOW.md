# Agent Workflow

This file defines a repeatable semi-automated workflow for building a project
with AI coding agents and human oversight.

The goal is to avoid deciding from scratch what to do after every task. Keep
`.agents/NEXT.md` current so the next chat can resume from repository state
instead of relying on chat history.

Every task completion must leave the operator with a concrete next step and a
copyable next-chat prompt.

## Operating Modes

The workflow supports three selectable modes plus the default Adaptive Teamflow
selector. Adaptive Teamflow chooses between the fast and secure paths per task
based on risk.

### Interactive Flow

Use Interactive Flow when the operator wants frequent steering, when product
direction is unclear, or when a task is exploratory enough that autonomous
delegation would probably create rework.

Rules:

- Work one step at a time.
- Prefer Planner or Architect clarification before implementation when scope is
  ambiguous.
- Stop after each implementation, review, or planning step with a concise
  summary and exact next prompt.
- Use the same task states, verification notes, review policy, and commit rules
  as the other modes.

### Fast Teamflow

Use Fast Teamflow for clear low-risk or medium-risk work where throughput and
iteration speed matter most.

Good candidates:

- documentation updates
- isolated UI polish or small page/component work
- test-only changes
- local developer tooling
- small internal cleanup with no public contract or shared data behavior

Rules:

- Multiple independent tasks may run in parallel only when write scopes are
  disjoint.
- Implementers must run task-local verification and record skipped checks with
  residual risk.
- Independent review is optional for low-risk work unless the task file or risk
  classifier requires it.
- Broad checks may be batched at checkpoint boundaries after several low-risk
  commits.
- If verification fails, review findings are broad, or task dependencies become
  unclear, leave Fast Teamflow and use Secure Teamflow or stop for the operator.

### Secure Teamflow

Use Secure Teamflow when correctness, privacy, security, financial behavior,
architecture boundaries, or public contracts matter more than raw throughput.

Rules:

- Serialize the work through implementation, independent review, focused fix if
  needed, and focused re-review.
- Use a fresh Reviewer that has not seen the Implementer conversation.
- Run the narrow checks required by the task and broader checks justified by
  the blast radius.
- Prefer Planner or Architect clarification before implementation when the task
  may change product scope, accepted decisions, dependencies, architecture
  boundaries, or security/privacy posture.
- Create durable review notes for both approved and failed reviews so the next
  agent can continue without chat history.
- Stop for the operator on critical risk, failed verification that cannot be
  bounded to one fix, unclear product/security decisions, approval
  requirements, destructive actions, or conflicting decisions.

### Adaptive Teamflow

Adaptive Teamflow is the normal autonomous mode. It classifies each next task,
chooses the fastest safe path, and continues without waiting for operator input
until a stop condition applies.

Rules:

- Use Fast Teamflow for low-risk tasks and for medium-risk tasks with clear
  scope, narrow write surfaces, and task-local verification.
- Use Secure Teamflow for high-risk tasks, critical tasks, or any task whose
  risk classification is unclear.
- When a task file explicitly requires independent review, treat that as a
  Secure Teamflow gate even if the implementation appears small.
- Do not reorder tasks across declared dependencies in `.agents/NEXT.md`, task
  files, or review notes.

## Performance and Quality Principles

Keep the workflow as light as the task allows. Add process only when it reduces
real risk, ambiguity, or rework.

- Start with the simplest sufficient path. A single focused implementer is
  better than a multi-role handoff for clear low-risk work.
- Use planning to remove ambiguity, not to create ceremony. Planning output
  should become ready tasks, decisions, or a direct stop reason.
- Keep prompts compact and complete: goal, context, constraints, done-when,
  expected output, and verification.
- Give each delegated role a bounded objective, relevant files, write scope,
  output format, and stop conditions.
- Parallelize only when work is independent, the write scopes are disjoint, or
  the task is breadth-first research or codebase exploration.
- Do not parallelize tasks that require shared live context, touch the same
  files, or depend on each other's unreviewed output.
- Prefer task-local checks first. Run broad checks when risk or blast radius
  justifies them, or batch broad checks at documented checkpoints.
- For AI behavior, prompt, ranking, routing, or other nondeterministic changes,
  define examples, evals, or scenario checks that can catch regressions.
- When an agent repeats a mistake, update the smallest durable instruction
  source that would have prevented it.

## Risk Classifier

Classify each task before implementation. If the classification is uncertain,
use the higher risk level.

Low risk:

- docs, copy, comments, or `.agents` planning updates
- isolated styling/layout changes that do not alter data flow
- test-only additions for existing behavior
- local tooling that does not affect production runtime

Low-risk default path: Fast Teamflow, implementer self-check, task-local
verification, no separate review unless requested.

Medium risk:

- isolated product UI behavior
- local/demo write flows for bounded non-production data
- small internal refactors with clear tests
- read-only application services or page data wiring

Medium-risk default path: Fast Teamflow when the task is well scoped and
disjoint; Secure Teamflow when it touches sensitive records, shared contracts,
or review is explicitly required.

High risk:

- authentication, authorization, permissions, tenant/customer isolation, or identity
- security, privacy, secrets, sensitive data handling, or audit behavior
- database schema, migrations, repositories, data access, or persistence
- financial, legal, compliance, billing, payment, or irreversible record behavior
- public HTTP API, webhook, OAuth, MCP, automation contracts, or external integrations
- deployment/runtime boundaries, production configuration, storage adapters, or dependency changes with broad impact
- broad refactors or cross-package behavior

High-risk default path: Secure Teamflow with mandatory independent review and
focused re-review after fixes.

Critical risk:

- destructive data actions or irreversible migrations
- production secrets, credentials, payments, filings, or legal/compliance commitments
- conflicting accepted decisions or root documentation
- unclear human/product/security decisions
- changes that require external approval

Critical-risk default path: stop for the operator or delegate Planner/Architect
clarification only. Do not implement until the decision is clear.

## Roles

- Orchestrator: coordinates the workflow, delegates role-specific work, and
  verifies task state, commits, and next action.
- Planner: keeps roadmap/backlog/tasks coherent.
- Architect: evaluates boundaries, tradeoffs, and decisions before risky
  implementation.
- Implementer: implements exactly one task, self-checks it, updates task state,
  updates `NEXT.md`, and commits.
- Reviewer: reviews completed work when the workflow calls for independent
  review.
- Integrator: applies review fixes when needed, updates task state, updates
  `NEXT.md`, and commits.

The same human can run all roles in separate chats. When sub-agents are
available, each role should run in a separate fresh context. Role-specific
guidance lives in `.agents/roles/`.

## Task States

Tasks live under:

```txt
.agents/tasks/ready/
.agents/tasks/in-progress/
.agents/tasks/done/
.agents/tasks/deferred/
```

Rules:

- Only tasks in `ready/` should be assigned to implementers.
- A worker should move its assigned task to `in-progress/` when starting.
- A worker should move the task to `done/` only after implementation and
  verification.
- Paused or intentionally deferred tasks may live under `deferred/`; they are
  historical/resume points, not assignable ready work.
- Review notes should go into `.agents/reviews/` when a separate review is
  performed, including failed or blocked reviews.
- Follow-up work should become a new task in `ready/` or an item in
  `.agents/BACKLOG.md`.

## Default Loop

When using manual chats, repeat this loop:

1. Pick the lowest-numbered task in `.agents/tasks/ready/`.
2. Start an Implementer chat with the implementer prompt.
3. Implementer completes the task, records handoff notes, verifies it, and
   performs the self-check.
4. If the task does not require separate review, the implementer moves it to
   `done`, updates `.agents/NEXT.md`, commits, and gives the next-chat prompt.
5. If the task requires separate review, the implementer moves it to `done`,
   updates `.agents/NEXT.md` to a reviewer prompt, commits, and gives that
   prompt.
6. If review finds issues, create a fix task or ask the implementer/integrator
   to fix only those findings.
7. After review or fixes pass, continue with the next ready task.
8. If no ready tasks remain, run the Planner prompt.

## Review Policy

Use separate reviewer chats only when risk justifies the overhead.

Separate review is required for tasks that touch:

- security, privacy, secrets, sensitive data handling, or audit behavior
- authentication, authorization, permissions, or isolation boundaries
- database schema, migrations, repository behavior, or data-access boundaries
- financial, legal, compliance, billing, payment, or irreversible record behavior
- public HTTP API, webhook, OAuth, MCP, automation contracts, or external integrations
- deployment/runtime boundaries, storage adapters, production configuration, or dependency changes with broad impact
- broad refactors, cross-package behavior, or high-impact dependencies

Separate review is optional for low-risk scaffold, documentation, styling,
small UI, test-only, or internal cleanup tasks when acceptance criteria and
verification pass.

Approve-only reviews are acceptable when the reviewer independently checks the
diff, acceptance criteria, and relevant narrow verification and finds no
actionable issue.

Blocking review findings must be concrete and actionable. A needs-changes
review should include file and line references where possible, the realistic
failure mode, severity, and the smallest safe fix scope.

Every task still needs an implementer self-check against:

- task scope and non-goals
- acceptance criteria
- relevant root documentation and decisions
- architecture boundaries
- security/privacy implications
- verification results
- unrelated changes

At the end of every chat, the agent must report:

- what changed
- what was verified
- whether separate review is required and why
- commit hash, unless no commit was created because of a stop condition
- what to do next
- the exact prompt to paste into the next chat

Use `.agents/NEXT.md` as the source of truth for the next action.

## Checkpoint Gate

Before ending a coordinated run, create a checkpoint. Stop for the operator only
if any item cannot be completed or produces a stop condition:

- worktree is clean, or uncommitted files are explicitly summarized as blockers
- `.agents/NEXT.md` is current and points to the next concrete action
- task states in `ready/`, `in-progress/`, `done/`, and `.agents/reviews/` are consistent
- required independent reviews are complete
- relevant task-local checks have passed or skipped checks are justified
- broader checks required by the blast radius have passed or residual risk is recorded
- blockers, failed checks, skipped checks, and residual risks are summarized

## Documentation Boundaries

Public, operator, user, developer, architecture, security, API, deployment,
domain, design, and extension documentation belongs in normal project
documentation such as root Markdown files or a root `docs/` tree.

Use `.agents/` only for operational workflow state: plans, task files, review
notes, handoffs, backlog snapshots, role prompts, and proposed decisions.
Promote durable rules back into root documentation when they become stable.

## Orchestrator Prompt

Use this as the normal starting prompt:

```txt
You are the Orchestrator for <PROJECT_NAME>.

Read:
- AGENTS.md
- README.md
- CONTRIBUTING.md
- .agents/WORKFLOW.md
- .agents/roles/orchestrator.md
- .agents/NEXT.md

Coordinate the next workflow step from .agents/NEXT.md.

Rules:
- Do not implement, review, or integrate directly unless the operator explicitly asks.
- Use Adaptive Teamflow unless .agents/NEXT.md or the operator selects another mode.
- Classify each task with the risk classifier before delegation; if unclear, choose the higher-risk path.
- Use fresh role-specific contexts for Implementer, Reviewer, Integrator, Planner, or Architect work when available.
- Give each role only the compact repository-local prompt it needs.
- For work requiring separate review, use a fresh Reviewer that did not see the Implementer conversation.
- Continue through bounded, clearly actionable review findings by delegating a focused fix, then run focused re-review.
- Stop only when a stop condition, failed verification, broad/risky review finding, unclear decision, approval requirement, destructive action, conflicting decision, or safely undelegable blocker blocks the loop.

When you stop, summarize:
- role chats or sub-agents run
- commits created or reviewed
- current .agents/NEXT.md action
- blockers or human decisions needed
```

## Implementer Prompt

Copy this into a fresh implementation chat:

```txt
You are the Implementer for <PROJECT_NAME>.

Read:
- AGENTS.md
- README.md
- CONTRIBUTING.md
- .agents/WORKFLOW.md
- .agents/decisions/
- <TASK_FILE>
- any root documentation referenced by the task

Implement exactly <TASK_FILE>.

Rules:
- Keep changes scoped to the task.
- Do not start unrelated refactors.
- Follow existing repository structure, style, and documented architecture boundaries.
- Update the task handoff notes before finishing.
- Run the verification steps listed in the task, or explain why they could not be run.
- Self-check against scope, acceptance criteria, relevant docs/decisions, architecture boundaries, security/privacy implications, and unrelated changes.
- Decide whether separate review is required using .agents/WORKFLOW.md.
- Move the task to .agents/tasks/done/ when implementation and verification are complete.
- Update .agents/NEXT.md with the next action and exact next-chat prompt.
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

## Reviewer Prompt

Copy this into a separate review chat only when independent review is required:

```txt
You are the Reviewer for <PROJECT_NAME>.

Review the completed task:
<TASK_FILE>

Read:
- AGENTS.md
- CONTRIBUTING.md
- .agents/WORKFLOW.md
- relevant root documentation
- relevant decisions in .agents/decisions/
- the changed files and diff

Review stance:
- Findings first.
- Prioritize correctness, architecture boundaries, security/privacy, authorization, public contracts, missing tests, and acceptance criteria gaps.
- Check that the implementation matches the task and does not include unrelated scope.
- Check that durable decisions are documented.

Output:
- findings with severity and file/line references
- acceptance criteria status
- test/verification gaps
- whether the task is approved or needs changes

Create or update a review note under .agents/reviews/ using REVIEW_TEMPLATE.md.
Update .agents/NEXT.md and commit the review note and workflow state changes.
Include the exact next-chat prompt the operator should paste into a new chat.
```

## Integrator Prompt

Use this when review finds bounded, actionable issues:

```txt
You are the Integrator for <PROJECT_NAME>.

Address review findings for:
<TASK_FILE>

Read:
- AGENTS.md
- README.md
- CONTRIBUTING.md
- .agents/WORKFLOW.md
- .agents/roles/integrator.md
- <TASK_FILE>
- <REVIEW_NOTE>
- changed files and diff for the reviewed commit

Rules:
- Fix only the concrete review findings assigned in <REVIEW_NOTE>.
- Do not broaden scope, redesign the task, or start unrelated refactors.
- Preserve existing behavior unless a review finding requires changing it.
- Run focused verification for the fix, or explain skipped checks and residual risk.
- Update task handoff notes and review notes when useful.
- Update .agents/NEXT.md with a focused re-review prompt or the next workflow action.
- Commit the integration fix with a Conventional Commit unless a stop condition prevents committing.

When done, summarize:
- findings addressed
- changed files
- verification performed
- whether focused re-review is required and why
- commit hash
- known gaps
- exact next-chat prompt from .agents/NEXT.md
```

## Planner Prompt

Use this when `.agents/tasks/ready/` is empty or the roadmap needs adjustment:

```txt
You are the Planner for <PROJECT_NAME>.

Read:
- AGENTS.md
- README.md
- CONTRIBUTING.md
- relevant root documentation
- .agents/ROADMAP.md
- .agents/EPICS.md
- .agents/BACKLOG.md
- .agents/tasks/
- .agents/reviews/
- .agents/decisions/

Create the next 3-5 implementation tasks.

Rules:
- Each task must be executable by one implementer chat.
- Use .agents/tasks/TASK_TEMPLATE.md.
- Put new tasks in .agents/tasks/ready/.
- Keep tasks small and reviewable.
- Include acceptance criteria and verification steps.
- Do not create vague or oversized tasks.
- Update BACKLOG.md, EPICS.md, and ROADMAP.md only if needed.
- Update .agents/NEXT.md with the next action and exact next-chat prompt.
- Commit the planning update with a Conventional Commit unless a stop condition prevents committing.

When done, summarize:
- new tasks created
- recommended next task
- open decisions or blockers
- commit hash
- exact next-chat prompt from .agents/NEXT.md
```

## Architect Prompt

Use this when a decision may affect architecture, security, public contracts, or
future implementation boundaries:

```txt
You are the Architect for <PROJECT_NAME>.

Read:
- AGENTS.md
- README.md
- CONTRIBUTING.md
- relevant root documentation
- .agents/WORKFLOW.md
- .agents/decisions/

Evaluate the requested decision or design question.

Rules:
- Identify constraints, tradeoffs, risks, and alternatives.
- Recommend whether the decision belongs in root documentation or .agents/decisions/.
- Do not implement unless the operator explicitly asks.
- If creating a decision note, use .agents/decisions/ADR_TEMPLATE.md.
- Update .agents/NEXT.md when the workflow next step changes.
- Commit documentation or workflow updates with a Conventional Commit unless a stop condition prevents committing.

When done, summarize:
- decision or recommendation
- files changed
- verification performed
- whether separate review is required and why
- commit hash
- exact next-chat prompt from .agents/NEXT.md
```

## Stop Conditions

Stop and ask for human direction when:

- a task conflicts with accepted decisions
- a decision changes product scope
- a security or privacy risk is unclear
- a dependency choice is irreversible or high impact
- implementation would require deleting or rewriting unrelated work
- verification fails and the fix is not bounded
- an action requires approval
- review findings are broad, risky, unclear, or cannot be safely delegated
