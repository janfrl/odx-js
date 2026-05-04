# Contributing

Read `README.md` before making changes.

This document defines contribution standards for human contributors and
automated coding agents.

## Repository Hygiene

Keep the repository conventional and tool-neutral.

Do not add tool-specific files or folders unless they are part of the agreed
project setup. Prefer documentation that is useful to all contributors.

Project context should live in normal project documentation such as
`README.md`, `ARCHITECTURE.md`, `DESIGN.md`, `SECURITY.md`, `API.md`,
`DEPLOYMENT.md`, `DOMAIN_MODEL.md`, or `CONTRIBUTING.md`.

Use `.agents/` only for operational planning, task state, role prompts, review
notes, and temporary workflow material.

## Scope and Change Size

Keep changes focused on the agreed scope.

Prefer small, reviewable changes over large rewrites. Roadmap items,
opportunistic improvements, and unrelated refactors should be handled
separately.

Preserve existing behavior unless the change intentionally modifies it.

## Implementation Standards

Follow the existing project structure, naming conventions, and coding style.

Prefer precise types, explicit data shapes, and clear interfaces. Validate
external inputs at system boundaries.

Do not silently swallow errors. Return or throw meaningful errors appropriate
to the layer.

Avoid bypassing type, lint, formatting, or static-analysis rules. Suppressions
should be local, justified, and used only when the alternative would make the
code worse.

Prefer straightforward implementation over cleverness.

## Architecture

Favor simple, readable architecture.

Keep core logic separate from framework, infrastructure, and integration
details where practical.

Keep entry points thin. Reusable logic should live in services, packages,
modules, or utilities rather than directly in UI components or route handlers
when that boundary is useful.

Use abstractions when they make code easier to understand, test, or change.
Avoid abstractions that only add indirection.

Document important architectural decisions when they affect future
contributors.

## Security and Privacy

Never hardcode secrets, tokens, credentials, or environment-specific endpoints.

Do not commit generated local data, uploaded files, private artifacts, logs, or
secrets.

Use environment variables or runtime configuration for deployment-specific
values.

Do not send private or sensitive user data to external services unless the
project explicitly allows it.

Avoid logging sensitive payloads, credentials, personal data, payment data, or
internal-only information.

## Dependencies

Do not add new dependencies unless they are necessary for the current change.

Prefer well-maintained, widely used packages. Before adding a dependency,
consider whether the existing stack already solves the problem.

If a dependency is added, ensure it is justified by the implementation and
reflected in the appropriate lockfile.

## Testing

Add or update tests when changing logic.

Prioritize tests for:

- parsing
- validation
- authorization
- security-sensitive behavior
- data transformation
- public contracts or APIs
- domain-specific calculations

If tests are not practical for a change, note the reason in the pull request or
final summary.

## Commits

Use Conventional Commits.

Examples:

- `feat: add project dashboard`
- `fix: validate missing email address`
- `test: add parser cases`
- `docs: update deployment notes`
- `refactor: extract storage adapter`

Avoid vague commit messages such as `update`, `fix stuff`, `changes`, or `wip`.

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
