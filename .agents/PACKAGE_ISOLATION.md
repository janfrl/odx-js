# Package Isolation Plan

This plan turns the monorepo package split into independently verifiable
developer surfaces. It is operational planning; promote durable package
contracts back into root docs or package READMEs when they stabilize.

## Current State

- `@bc8-odx/core` has focused utility and parser tests, but no runnable example
  that demonstrates framework-free usage.
- `@bc8-odx/proxy` has H3 fixture tests and integration coverage, but no
  standalone example app that a contributor can run outside the full Nuxt
  playground.
- `@bc8-odx/nuxt` is verified through Nuxt test fixtures and the root
  playground, but it lacks a smallest-possible package-specific playground.
- `@bc8-odx/explorer` has state/composable tests and a Nuxt app surface, but
  should be handled carefully because the UI is already in a good state.
- `packages/approuter` is deployment-specific and should be verified through
  configuration checks and documentation rather than a local playground first.

## Recommended Verification Story

### Core

Best fit: examples plus focused tests.

- Add a small `examples/core-basic` or package-local example script that parses
  EDMX fixtures, stringifies OData queries, flattens V2/V4 responses, and shows
  framework-free usage.
- Keep it dependency-light and executable through a package or root script.

### Proxy

Best fit: standalone H3 example plus performance benchmark.

- Add a standalone proxy example using `createODataHandler(config)` and the
  existing local fixture backend.
- Keep it separate from Nuxt so `@bc8-odx/proxy` can be verified as an H3
  server package.
- Use local fixtures only; do not require SAP/BTP services.

### Nuxt

Best fit: minimal Nuxt module playground.

- Add a minimal package-specific playground or fixture that registers only
  `@bc8-odx/nuxt`, a local EDMX service, and one composable page.
- Keep it much smaller than the current root playground.
- Verify generation, registry typing, and direct/proxied request paths.

### Explorer

Best fit: tests first, then a fixture only if tests expose a need.

- Expand state/composable tests before touching UI.
- If a standalone Explorer fixture is added, keep it data-driven and visually
  unchanged.
- Use browser verification late and on port `3000` only when UI behavior
  changes.

## First Implementation Tasks

1. Create a framework-free core/proxy example pair:
   - core script using EDMX and OData utility fixtures
   - proxy H3 example using `createODataHandler`
   - root scripts to run both locally

2. Add a minimal Nuxt package playground:
   - local EDMX service
   - one composable usage page
   - explicit verification command

3. Expand Explorer tests without UI changes:
   - traffic-log state
   - proxy trace selection
   - entity/query state transitions

## Tradeoffs

- Separate playgrounds increase maintenance cost. Keep them minimal and focused
  on package boundaries, not feature demos.
- Examples should reuse existing fixtures where possible so they do not drift
  from tests.
- Do not add package-isolation examples that duplicate the full root playground.
