# Contributing

Read `README.md` before making changes.

This document defines the contribution standards for this repository. It applies to human contributors and automated coding agents alike.

## Repository Hygiene

Keep the repository conventional and tool-neutral.

Do not add tool-specific files or folders unless they are part of the agreed project setup. Avoid adding files only to support a specific editor, assistant, or automation tool.

Examples of files and folders that should not be introduced casually:

- `.claude`
- `.gemini`
- `.cursor/rules`
- `/ai`
- `/prompts`
- `/tasks`

Project context should live in normal project documentation such as `README.md`, `ARCHITECTURE.md`, or `CONTRIBUTING.md`.

Prefer documentation that is useful to all contributors.

## Scope and Change Size

Keep changes focused on the agreed scope.

Prefer small, reviewable changes over large rewrites.

Roadmap items, opportunistic improvements, and unrelated refactors should be handled separately.

If a change reveals a larger architectural concern, document it briefly and address it in a dedicated follow-up unless it directly blocks the current work.

Preserve existing behavior unless the change intentionally modifies it.

## Implementation Standards

Follow the existing project structure, naming conventions, and coding style.

Prefer precise types, explicit data shapes, and clear interfaces where the language or framework supports them.

Validate external inputs at system boundaries.

Do not silently swallow errors. Return or throw meaningful errors appropriate to the layer.

Avoid bypassing type, lint, formatting, or static-analysis rules. Suppressions should be local, justified, and used only when the alternative would make the code worse.

Examples of bypasses that need a clear reason include `any`, `unknown` without narrowing, `@ts-ignore`, `@ts-expect-error`, `eslint-disable`, unchecked casts, and broad exception handling.

Prefer straightforward implementation over cleverness.

## Architecture

Favor simple, readable architecture.

Keep core logic separate from framework, infrastructure, and integration details where practical.

Keep entry points thin where practical. Reusable logic should live in the project’s existing service, domain, library, or utility modules.

Use abstractions when they make the code easier to understand, test, or change. Avoid abstractions that only add indirection.

Choose patterns that fit the existing codebase. Do not introduce a new architectural style unless the change clearly needs it.

Avoid hiding simple logic behind unnecessary framework, factory, or configuration layers.

Document important architectural decisions when they affect future contributors.

## Code Quality

Favor clear, maintainable code.

Keep functions focused and reasonably small.

Avoid unnecessary global state.

Prefer code that future contributors can understand quickly.

When modifying existing code, align with nearby patterns unless there is a clear reason to improve them.

## Security and Privacy

Never hardcode secrets, tokens, credentials, or environment-specific endpoints.

Do not commit generated local data, uploaded files, logs, or secrets.

Use environment variables or runtime configuration for deployment-specific values.

Handle user-provided input defensively.

Do not send private or sensitive user data to external services unless the project explicitly allows it.

Avoid logging sensitive payloads, credentials, personal data, or internal-only information.

## Dependencies

Do not add new dependencies unless they are necessary for the current change.

Prefer well-maintained, widely used packages.

Before adding a dependency, consider whether the existing stack already solves the problem.

Avoid adding overlapping libraries that solve the same problem.

If a dependency is added, ensure it is justified by the implementation and reflected in the appropriate lockfile.

## Generated Files and Artifacts

Do not commit generated files unless the repository already tracks them or the change explicitly requires it.

Avoid committing local caches, temporary files, build outputs, uploaded data, logs, or machine-specific configuration.

Respect existing `.gitignore` patterns.

## Testing

Add or update tests when changing logic.

Prioritize tests for:

- parsing
- validation
- authorization
- security-sensitive behavior
- data transformation
- bug fixes
- reusable services
- public contracts or APIs

Do not add brittle tests that only verify implementation details.

If tests are not practical for a change, note the reason in the pull request or final summary.

## Checks

Use judgment when deciding which checks to run locally.

For small documentation changes, isolated refactors, or clearly local edits, a lighter review may be enough.

Run relevant checks when:

- the change is complex or touches multiple areas
- public contracts, types, schemas, or APIs change
- parsing, validation, authorization, privacy, or security-sensitive logic changes
- dependencies or build configuration change
- a bug fix needs verification
- behavior is difficult to verify by inspection

Prefer automated enforcement through project tooling such as CI, pre-commit hooks, package scripts, and branch protection rules.

## Documentation

Update documentation when behavior, setup, architecture, or public APIs change.

Do not create documentation files solely for contributor convenience if the content belongs in an existing document.

Keep documentation concise, accurate, and close to the actual implementation.

Prefer updating existing documentation over adding new files.

## Commits

Use Conventional Commits.

Examples:

- `feat: add upload endpoint`
- `fix: handle empty input`
- `test: add validation tests`
- `docs: update setup instructions`
- `refactor: extract storage service`
- `chore: configure workspace scripts`

Avoid vague commit messages such as:

- `update`
- `fix stuff`
- `changes`
- `wip`

Keep commits reasonably sized and logically grouped.

Do not force unrelated changes into a single commit. Split work into multiple commits when it makes the commit type and message clearer.

Each commit should represent one coherent change, so the Conventional Commit type accurately describes the content.

## Review Checklist

Before finishing a change, verify that it:

- matches the agreed scope
- follows repository conventions
- does not introduce unrelated changes
- does not add unnecessary files or dependencies
- preserves existing behavior unless intentionally changed
- includes relevant tests or has a clear reason why tests are not needed
- updates documentation when relevant
- avoids leaking secrets, private data, or environment-specific values

When submitting a change, summarize the intent, relevant implementation notes, verification performed, and any known follow-up work.
