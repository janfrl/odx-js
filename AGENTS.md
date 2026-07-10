# AGENTS.md

Follow the repository documentation.

Start with:

1. `README.md` - project purpose, setup, and usage
2. `CONTRIBUTING.md` - contribution standards, scope, code quality, testing,
   security, dependencies, commits, and review expectations

## Additional Context

Check these root-level documents when they are present and relevant:

- `ARCHITECTURE.md` - system structure, boundaries, data flow, and major technical decisions
- `DESIGN.md` - product UX, design system, theming, and branding rules
- `SECURITY.md` - security policy, privacy rules, sensitive data handling, and audit expectations
- `API.md` - public API, automation, OAuth, MCP, and integration contracts
- `DEPLOYMENT.md` - hosting, runtime targets, environment configuration, and release notes
- `DOMAIN_MODEL.md` - durable domain concepts, entities, relationships, and rules
- `EXTENSIONS.md` - extension strategy, plugin boundaries, hooks, and customer extension rules

Keep project knowledge in normal documentation files. Do not introduce
assistant-specific folders or tool-only instruction files unless they are
explicitly part of the agreed project setup.

Use the source that owns the information. Source files own implementation
facts, tests own behavioral expectations, user-facing docs own product usage,
and root guides own durable project rules.

Temporary planning belongs in issues, pull requests, task tools, or agreed
workspace notes rather than repository-local agent workflow folders.
