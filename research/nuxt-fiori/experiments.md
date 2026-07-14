# Experiment and validation plan

Date: 2026-07-14

Status: required before implementation roadmap approval

## Purpose

The proposed architecture is intentionally broad enough to support a Fiori
Elements replacement. That breadth creates a risk of designing elegant
interfaces that fail under real draft, side-effect, value-help, SSR, or
framework constraints.

The experiment is therefore not a demo. It is a falsification exercise with
fixed fixtures, competing renderers, a second framework, request traces, and
performance/accessibility baselines.

## Hypotheses

| ID | Hypothesis | Falsified when |
| --- | --- | --- |
| H1 | OData/SAP annotations can compile into a stable, UI-neutral semantic bundle. | A required List Report/Object Page behavior needs renderer- or Vue-specific data in the bundle. |
| H2 | Transactional behavior can live in serializable headless controllers. | Draft, side effects, messages, or action results require DOM/component ownership. |
| H3 | UI5 Web Components materially reduce Fiori primitive maintenance. | Required controls need extensive forks, shadow-DOM workarounds, or reimplementation. |
| H4 | The same controllers can drive UI5 WC and Nuxt UI renderers. | Renderer switching requires changes to query, annotation, draft, or validation logic. |
| H5 | The same controller traces can drive Vue and React. | The core requires Vue refs/watchers or React hooks/concurrent-render assumptions. |
| H6 | Build-time compilation can keep production startup and bundles competitive. | The browser still needs the full metadata/vocabulary compiler or hydration becomes slower/larger than the baselines without a compensating benefit. |
| H7 | SAP Open UX packages can reduce compiler maintenance. | They are Node-only, unstable, incomplete for runtime semantics, or harder to isolate than a focused parser. |
| H8 | A separate Nuxt Fiori repository produces a clean public ODX seam. | The product repeatedly needs ODX internals or coordinated private changes across repositories. |

H7 is provisionally satisfied for a bounded dependency surface. The
[2026-07-14 package spike](./sap-open-ux-package-spike.md) accepted SAP's
vocabulary and annotation-core packages for build-time lookup while rejecting
its duplicate parsers/models as production dependencies. Compatibility and
bundle-isolation fixtures remain required before the hypothesis is closed.

## Fixtures

### Fixture A: structural OData V2

A small Northwind-style service tests:

- primitive and nullable types;
- single and composite keys;
- navigation and referential constraints;
- server paging, count, filter, sort, select and expand;
- create, update and delete;
- legacy SAP V2 annotation normalization;
- CSRF and ODX proxy behavior.

Purpose: prove that V4-first semantics do not regress ODX's existing V2
foundation. Full draft parity is not expected.

### Fixture B: transactional OData V4

Create a deterministic CAP or equivalent fixture with:

- `SalesOrders` and contained/navigated `Items`;
- semantic key plus technical UUID;
- amount/currency and quantity/unit pairs;
- customer value help with in/out parameters and search;
- `UI.SelectionFields`, `UI.LineItem`, `UI.HeaderInfo`, `UI.Facets`,
  `UI.FieldGroup`, `UI.Identification`, and presentation variants;
- static and dynamic `Hidden`/`FieldControl`/action availability;
- validation constraints and server validation messages;
- draft edit, background save, prepare, activate and discard;
- bound `Approve` and `Reject` actions with parameters and critical
  confirmation;
- side effects from item quantity to item amount and order total;
- an ETag conflict path;
- create/delete and a navigation from list to object;
- enough rows to exercise server paging and virtualization.

Use stable fixture data and deterministic server delays/errors. Do not rely on a
public service for correctness tests.

### Fixture C: scale corpus

Generate metadata and annotations at several sizes:

| Size | Entities | Properties/entity | Annotated fields | Relationships |
| --- | ---: | ---: | ---: | ---: |
| Small | 5 | 12 | 30 | 6 |
| Medium | 50 | 30 | 500 | 80 |
| Large | 200 | 60 | 4,000 | 400 |

Include qualified annotations, path expressions, local overlays, unsupported
terms, and deliberate errors. This measures compiler scaling and diagnostic
quality without network noise.

### Reference behavior

Use the maintained
[SAP Fiori Elements feature showcase](https://github.com/SAP-samples/fiori-elements-feature-showcase)
and official documentation as behavioral references. The experiment fixture
should be smaller and owned locally so tests do not depend on SAP sample
changes.

## Experiment 0: metadata and reuse spike

Build no UI.

Compare:

1. a focused lossless ODX metadata representation;
2. the accepted SAP vocabulary/name/path packages behind an owned compiler adapter, with SAP converters used only as result oracles;
3. a minimal owned parser only where required.

Test:

- CSDL XML and JSON ingestion;
- V2 normalization;
- aliases, overloads, paths and expression trees;
- SAP Common/UI and OASIS Core/Capabilities/Validation coverage;
- local annotation precedence and provenance;
- deterministic serialization and hashing;
- browser-free build operation;
- diagnostic source locations;
- cold/warm compile time and peak memory for all corpus sizes;
- installed size, transitive dependency count, license and release stability.

Gate:

- Choose reuse only if it passes the required corpus and can be wrapped in an
  owned, versioned ODX metadata contract.
- Do not ship SAP tooling packages to the browser merely because they are
  already available on npm.
- If neither reuse nor a focused parser can preserve expressions and provenance
  cleanly, stop and revise the ODX metadata boundary.

## Experiment 1: semantic compiler

Compile Fixture B into golden `SemanticBundle` snapshots.

Assertions:

- all static paths and aliases resolve;
- required dynamic expressions remain typed AST nodes;
- every rendered field/action contributes projection dependencies;
- value-help mapping and side-effect graph are explicit;
- draft and concurrency profiles are explicit;
- stable semantic IDs do not change after unrelated annotation order changes;
- unsupported or invalid annotations produce actionable diagnostics;
- raw XML ordering/formatting does not affect semantic output;
- no component name, CSS class, Vue type, or DOM concept occurs in the bundle.

Mutation tests should delete or corrupt one required annotation at a time and
verify a diagnostic or documented fallback.

## Experiment 2: controller conformance

Run controllers without a browser using scripted event traces.

Required trace:

1. load list with default presentation and count;
2. enter filter values using a context-dependent value help;
3. apply filter, sort, page, select and navigate;
4. enter object edit mode and obtain the draft context;
5. change quantity twice while the first request is in flight;
6. observe ordered autosave, ETag propagation, side-effect refresh and updated
   totals;
7. receive a field message and navigate focus intent to its semantic field ID;
8. invoke a critical action with parameter validation;
9. cancel once, then repeat and activate;
10. simulate an ETag conflict and recover without losing unrelated input;
11. create and delete a child item;
12. restore a saved filter/table variant.

Assertions:

- snapshots and event logs are deterministic under a virtual clock;
- stale responses never overwrite newer input;
- every request has an expected query, group, change set and projection;
- failed mutations keep or roll back state according to explicit policy;
- messages have stable semantic targets;
- controller disposal cancels work and subscriptions;
- no framework package is present in the core dependency graph.

### State implementation comparison

Implement the draft/object controller behind the same conformance suite using:

- an explicit reducer/subscription store;
- XState or another state-machine candidate.

Freeze comparison criteria before measuring:

- core and gzip size;
- number of invalid states representable;
- race/cancellation behavior;
- trace readability;
- test coverage and mutation score;
- adapter code size;
- contributor comprehension in a short design review.

Choose the simpler option that passes. Do not generalize the chosen mechanism
to every controller unless it improves that controller.

## Experiment 3: Nuxt + UI5 WC vertical

Build a Nuxt application containing:

- Smart Field and Smart Form;
- Smart Filter Bar;
- Smart Table;
- Value Help dialog;
- Message presentation;
- List Report;
- Object Page;
- draft and action flows.

Requirements:

- UI5 WC imports are generated/per-component, not an all-components bundle;
- controllers are created outside visual component implementation;
- Nuxt SSR fetches initial list/object snapshots;
- hydration performs no duplicate initial request;
- semantic extension points can add one field, one action, and one custom
  section without selecting generated DOM;
- keyboard use covers the entire trace;
- high-contrast and RTL modes are exercised;
- browser history/back restores meaningful page state.

This is the first product-like slice, but it is not accepted on appearance
alone.

## Experiment 4: renderer swap

Render the same Vue controllers and Fixture B subset through Nuxt UI:

- filter form;
- value help;
- table with server paging/sorting and virtualized rows;
- object form with field messages;
- action confirmation.

Rules:

- no semantic compiler or controller file changes;
- renderer-specific mapping and layout changes are expected;
- semantic event names and request traces must remain identical;
- unsupported renderer features must be declared as capabilities and produce a
  diagnostic/fallback, not hidden branches in core.

Gate:

- If more than a small mapping layer needs to duplicate annotation or
  transaction logic, redesign the renderer contract before adding features.
- If the contract forces both renderers into visibly poor lowest-common-
  denominator UX, allow renderer capabilities and specialized layout while
  retaining common semantics.

## Experiment 5: React portability proof

Build a React page using the same published semantic core and ODX bridge:

- collection/filter/table controller;
- object/form controller;
- value help;
- one draft edit and bound action;
- UI5 Web Components through the maintained React integration or React 19
  custom-element support.

Compare the normalized controller event and OData request trace with Vue.

Acceptance:

- no fork of semantic types or event names;
- no Vue dependency pulled transitively;
- React adapter contains lifecycle/reactivity code, not annotation decisions;
- core tests run unchanged;
- differences are limited to component composition, framework event plumbing,
  focus and SSR integration.

Angular and Svelte adapters are not built yet. Document how their subscription
and dependency-injection models would bind to the controller contract.

## Performance benchmark

### Compared builds

| ID | Build |
| --- | --- |
| B0 | Handwritten Nuxt UI list/object app with equivalent fixture behavior |
| B1 | Handwritten Vue + UI5 WC app with equivalent fixture behavior |
| B2 | Proposed Nuxt Fiori + UI5 WC renderer |
| B3 | Proposed Nuxt Fiori + Nuxt UI renderer |
| B4 | SAP Fiori Elements reference where the same service/behavior can be configured fairly |

B4 is contextual rather than a release gate when feature or deployment
differences prevent a controlled comparison. B0/B1 are the primary overhead
baselines.

### Measurement protocol

- Pin Node, pnpm, Nuxt, browser, OS profile and benchmark hardware.
- Build production artifacts from a clean cache.
- Record at least 30 lab runs after warm-up; report median, p75 and p95.
- Test both local low-latency and shaped enterprise latency.
- Record raw results and scripts in the future product repository.
- Freeze budgets after measuring B0/B1 and before optimizing B2/B3.
- Report regressions, not only winning metrics.

### Metrics

Build/compiler:

- cold/warm metadata compile time;
- peak RSS;
- emitted semantic-bundle size;
- route generation time;
- cache hit rate and invalidation correctness.

Bundle:

- initial and async route JavaScript, raw and gzip;
- CSS size;
- duplicate framework/runtime modules;
- imported UI5 WC/Nuxt UI components;
- semantic compiler code present in production client;
- source-map and dependency contribution.

Runtime:

- server response and rendered HTML size;
- hydration time and mismatch count;
- time until controls are interactive;
- LCP, INP (field/real-user or scripted interaction equivalent), CLS and TBT;
- long tasks and main-thread scripting;
- network request count/bytes and duplicate requests;
- DOM nodes, retained contexts and memory after repeated navigation;
- filter apply, sort, page, value-help open/search/select, field edit,
  side-effect completion, draft activate and route restore latency.

Data efficiency:

- properties requested versus properties rendered/required;
- unnecessary expands;
- requests per edit/action;
- batch utilization;
- side-effect target precision;
- list rows held in memory/DOM.

### Provisional performance gates

The final comparative budgets are frozen from B0/B1. These absolute product
floors also apply:

- production browser does not parse raw CSDL or load the full compiler;
- initial SSR hydration issues no duplicate metadata or data request;
- zero hydration mismatch in the test routes;
- p75 LCP <= 2.5 seconds, INP <= 200 ms, and CLS <= 0.1 in the representative
  deployment profile, matching the current "good" Core Web Vitals thresholds;
- no user interaction in the scripted trace creates an unexplained task over
  50 ms on the benchmark machine;
- virtualized 10,000-row scenarios keep rendered/retained row UI bounded rather
  than proportional to the full collection;
- B2/B3 overhead over their handwritten B1/B0 baseline must be itemized. An
  unexplained 25% or greater regression in initial JS, hydration, or key
  interaction p95 blocks release until accepted explicitly.

The 25% comparison is a decision trigger, not a universal web-performance
standard.

## Accessibility and design validation

Target WCAG 2.2 AA for the owned compositions. Component-library claims are not
accepted as application conformance.

Automated:

- semantic HTML/ARIA and accessible-name checks;
- axe or equivalent on every state in the trace;
- color contrast for criticality and disabled/read-only states;
- no duplicate IDs after repeated generated sections;
- focus visibility and modal focus containment.

Manual:

- keyboard-only list, filter, value-help, object and message navigation;
- screen-reader pass on field label/help/error, table headers/selection,
  message target navigation and draft status;
- 200% zoom and narrow responsive layout;
- high contrast, light/dark where supported, LTR and RTL;
- touch target and drag-alternative checks;
- reduced-motion behavior.

Compare UI5 WC and Nuxt UI mappings separately. A shared controller does not
imply shared accessible markup.

## Compatibility matrix

Run the vertical against:

- current supported Nuxt/Vue and previous supported minor according to the
  future package policy;
- Chromium, Firefox and WebKit;
- Node LTS versions supported by ODX/Nuxt;
- OData V4 fixture and V2 structural fixture;
- direct ODX core transport test plus Nuxt proxy path;
- renderer dependency minimum and current versions.

Dependency updates must rerun controller, SSR, accessibility, and performance
smokes. Visual snapshots alone are insufficient.

## Hard stop conditions

Stop the product extraction and return to architecture if any persists after
one focused redesign:

- semantic core imports a framework or renderer;
- UI5 WC requires maintained forks of core primitives;
- Nuxt UI renderer duplicates SAP annotation or transaction logic;
- Vue and React cannot pass the same normalized controller traces;
- metadata compiler cannot preserve unsupported expressions and provenance;
- draft/side-effect races cannot be modeled deterministically;
- production requires full compiler/vocabulary packages in the browser;
- SSR/custom-element behavior causes unacceptable layout shift or interaction
  delay without a credible fix;
- the new repository needs unpublished ODX internals;
- required accessibility behavior cannot be implemented through stable renderer
  APIs.

## Experiment outputs

The implementation spike must leave:

- versioned fixtures and expected request/controller traces;
- golden semantic bundles and diagnostic snapshots;
- dependency/reuse decision record;
- benchmark scripts and raw results;
- accessibility report;
- renderer and framework leakage audit;
- updated capability matrix;
- explicit go/revise/stop decision;
- package ownership and release-policy proposal.

Do not turn the spike directly into production code unless it passes these
gates and receives an owner decision. Extraction quality matters more than
preserving experiment history.

