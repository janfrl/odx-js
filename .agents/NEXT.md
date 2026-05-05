# Next Action

This file tells the human/operator what to do next and gives the exact prompt
to paste into the next chat.

Update it after every completed implementation, review, planning, integration,
or workflow task.

## Current Mode

Adaptive Teamflow.

## Current Next Step

Create the next 3-5 ready tasks from the latest stability and performance
analysis.

## Prompt For Next Chat

```txt
You are the Planner for ODX in C:\Users\janfr\Documents\GitHub\2.bechtle\odx-js on branch codex/orchestrator-8h-analysis.

Create the next 3-5 ready tasks.

Read:
- AGENTS.md
- README.md
- CONTRIBUTING.md
- .agents/WORKFLOW.md
- .agents/NEXT.md
- .agents/BACKLOG.md
- .agents/ROADMAP.md
- .agents/PACKAGE_ISOLATION.md
- `.agents/tasks/done/058-quote-generated-registry-service-keys.md`
- `.agents/tasks/done/059-cover-buffered-service-specific-response-hooks.md`
- `.agents/tasks/done/060-validate-proxy-benchmark-iteration-env.md`
- `.agents/tasks/done/061-document-service-name-type-generation-limits.md`
- `.agents/tasks/done/062-run-stability-and-hooks-checkpoint.md`
- `.agents/reviews/059-cover-buffered-service-specific-response-hooks-review.md`

Rules:
- Create concrete ready tasks for failing-test-first stability bugs,
  benchmark reliability/performance confidence, and package-isolation
  verification.
- Consider these read-only Explorer candidates: URI-encode Nuxt OData string
  keys, verify non-identifier service names in the minimal Nuxt playground,
  reject malformed benchmark report timing fields before formatting/output,
  and protect DevTools log storage from external mutation.
- Do not duplicate completed tasks 058-062.
- Keep each task small, testable, and executable by one implementer chat.
- Update `.agents/NEXT.md` with the next workflow action and exact next-chat prompt.
- Commit the planning update with a Conventional Commit unless a stop condition
  prevents committing.

Verification:
- Review task files for clear scope, acceptance criteria, verification, and
  review requirements.
- `git diff --check`

Output:
- new tasks created
- recommended next task
- open decisions or blockers
- commit hash
- exact next-chat prompt from `.agents/NEXT.md`
```
