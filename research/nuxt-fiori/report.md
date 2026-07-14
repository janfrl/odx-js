# Nuxt Fiori research report

Date: 2026-07-14

Status: recommendation ready for owner review; implementation remains gated by
the experiments in [experiments.md](./experiments.md)

## Executive conclusion

Proceed with Nuxt Fiori as a separate product repository built on published ODX
packages.

The product should not be a Vue wrapper around OData requests or a control-by-
control clone of SAP UI5. Its durable value is a semantic application layer
that compiles OData and SAP annotations into a versioned, UI-neutral model,
then drives headless query, transaction, draft, message, value-help, action,
and floorplan controllers.

Use UI5 Web Components for the first complete renderer. They are the lower-risk
way to inherit SAP-oriented visual primitives, accessibility behavior, themes,
icons, and internationalization. Treat them as replaceable leaves. They do not
provide OData binding, annotation interpretation, transaction management,
Smart Controls, or Fiori Elements floorplans.

Build Nuxt UI as a first-class alternative renderer against the same semantic
descriptors and controllers. Prove framework neutrality with a focused React
adapter after the Vue/Nuxt vertical works. Do not promise equally mature
Angular, Svelte, and React products at launch.

ODX should remain the protocol and developer-experience foundation. It needs
one additive capability for this direction: a published, lossless, UI-neutral
metadata package. Existing ODX APIs and V2/V4 functionality must not shrink.

## Decision

Recommendation: GO to a bounded architecture experiment, not directly to
production implementation.

The experiment must prove four boundaries:

1. Metadata and annotations compile into a deterministic semantic bundle
   without framework or renderer concepts.
2. Headless controllers model real draft, side-effect, value-help, action,
   message, batching, and concurrency behavior deterministically.
3. The same Vue controllers render through UI5 Web Components and Nuxt UI
   without duplicated annotation or transaction logic.
4. A React adapter replays the same normalized controller and request traces
   without forking the semantic core.

Failure of one boundary means revise the architecture. Persistent framework or
renderer leakage is a stop condition, not technical debt to accept for speed.

## What was established

### Facts from the current repository

- ODX already owns the correct foundation: service configuration, V2/V4
  transport, proxying, CSRF handling, metadata retrieval, type generation,
  typed CRUD/query access, and Explorer tooling.
- The public core is deliberately framework agnostic.
- Current EntityMapping is a useful structural projection, not a lossless CSDL
  and annotation graph.
- Current useOData is typed CRUD/query access, not a binding, transaction, or
  application-semantic runtime.
- ODX delegates SDK generation to odata2ts, showing an existing preference for
  reuse behind an owned package surface.
- All four reusable ODX product packages are public; the private AppRouter
  workspace is a deployment application, not a reusable library.

These facts make ODX a strong dependency for Nuxt Fiori, but they do not make
ODX the right owner of a UI application framework.

### Facts from the incumbent ecosystem

- SAP metadata-driven controls separate generic behavior from model/protocol
  specifics with delegates and unified property information.
- Fiori Elements spans annotations, templating/building blocks, bindings,
  transaction ordering, draft lifecycle, side effects, messages, variants,
  navigation, extensions, and floorplans. It is more than generated markup.
- SAP UI annotations are technology independent; they describe semantics but
  do not prescribe a Vue component architecture.
- UI5 Web Components provide framework-agnostic enterprise UI primitives. The
  host application/framework still provides state and binding.
- The reviewed UI5 Web Components catalog does not itself supply a complete
  OData/Fiori Elements layer, Filter Bar/Object Page system, or variant
  management system.
- Nuxt UI supplies Vue-native, SSR-compatible form, table, overlay, navigation,
  and virtualization primitives, but no OData/SAP annotation semantics.
- Headless cores with framework adapters are established patterns in TanStack
  Table and JSON Forms. They are precedents, not proof that the harder Fiori
  transaction model will transfer without experiments.

Detailed citations and dated negative results are in
[source-log.md](./source-log.md).

### Inferences

- UI5 Web Components can lower renderer maintenance, but cannot lower semantic
  and transaction maintenance unless Nuxt Fiori owns those layers cleanly.
- The highest-value reusable abstraction is not a universal Smart Component
  custom element. It is a serializable semantic bundle plus controller
  contracts.
- Smart Components are framework-aware at their composition edge: lifecycle,
  reactivity, focus, slots, routing, and SSR differ. Their decisions and state
  transitions do not need to be framework-specific.
- React is the best second-framework test because its update model is different
  enough from Vue to expose accidental coupling.
- A separate repository creates a valuable test: Nuxt Fiori must consume ODX
  through public, published contracts.
- V4 should lead the semantic product. V2 remains supported through explicit,
  per-capability compatibility instead of a vague parity claim.

## Product definition

Nuxt Fiori should make an annotated OData service useful with very little
application code while retaining controlled escape hatches.

Its first useful product is a transactional List Report and Object Page stack:

- metadata-driven fields, forms, filters, tables, facets, headers, and actions;
- typed query planning, projection, paging, filtering, sorting, and search;
- value help with dependent in/out parameters;
- validation and field/entity/global messages;
- batch/change-set behavior and optimistic concurrency;
- draft edit, autosave, prepare, activate, and discard;
- side-effect planning and targeted refresh;
- create, update, delete, and bound actions;
- variants and personalization based on stable semantic IDs;
- semantic extensions for fields, actions, sections, controllers, and renderers;
- Nuxt SSR/hydration without duplicate metadata or data requests;
- diagnostics for unsupported, conflicting, or degraded semantics.

Replacement means equivalent application capability and a better developer
model. It does not initially mean pixel parity, every historical V2 Smart
Control feature, every analytical/hierarchy feature, or replacement of Fiori
Launchpad and Work Zone.

The complete scope is in [capability-matrix.md](./capability-matrix.md).

## Architecture recommendation

### Repository placement

Create a new Nuxt Fiori repository after the experiment proves the boundary.

Keep in ODX:

- existing core, proxy, Nuxt, Explorer, and generated-client behavior;
- a new optional lossless metadata package;
- generic CSDL XML/JSON ingestion;
- V2 structural and legacy annotation normalization;
- annotation expression preservation and source provenance;
- deterministic metadata IDs, hashes, and serialization.

Keep in Nuxt Fiori:

- OASIS/SAP semantic interpretation for application behavior;
- compiled field, collection, form, operation, value-help, side-effect, and
  floorplan descriptors;
- framework-neutral controllers and transaction coordination;
- framework adapters and UI5 Web Components/Nuxt UI renderers;
- List Report/Object Page composition;
- extensions, diagnostics, variants, and application DevTools.

ODX must never depend on Nuxt Fiori.

### Package shape

| Package | Purpose | Publication |
| --- | --- | --- |
| @me-tools/odx-metadata | Lossless, UI-neutral OData metadata contract | Public ODX package |
| @me-tools/fiori-core | Compiler, semantic IR, controllers, planning, diagnostics | Public |
| @me-tools/fiori-odx | Adapter from semantic intents to ODX contracts | Public |
| @me-tools/fiori-vue | Vue lifecycle, subscriptions, injection, SSR bindings | Public |
| @me-tools/fiori-renderer-ui5 | Vue Smart Components using UI5 WC | Public |
| @me-tools/fiori-renderer-nuxt-ui | Vue Smart Components using Nuxt UI | Public |
| @me-tools/nuxt-fiori | Nuxt module, compiler, routes, imports, DevTools | Public |
| @me-tools/fiori-react | Portability adapter after the proof | Public when supported |

All reusable library packages should be published. Benchmarks, fixtures,
playgrounds, and examples remain applications or test fixtures rather than
artificial packages. Names/scopes are illustrative; boundaries are the
recommendation.

### Runtime layering

| Layer | Owns | Must not own |
| --- | --- | --- |
| ODX | Transport, proxy, CSRF, metadata representation, request execution | SAP UI semantics, visual components |
| Semantic compiler | Annotation resolution, semantic IR, dependencies, diagnostics | Framework objects, DOM, components |
| Controllers | State, query intent, transactions, drafts, messages, variants | Rendering, framework lifecycle |
| Framework adapter | Reactivity, lifecycle, injection, SSR serialization | Annotation decisions, OData URLs |
| Renderer | Components, focus, keyboard, accessible markup, design tokens | Metadata parsing, transactions |
| Host | Routes, auth integration, storage, policy, extensions | Generated DOM coupling |

The [architecture proposal](./architecture.md) defines the semantic bundle,
controller families, renderer registry, transaction flow, extensions, SSR,
security, and dependency policy.

## Renderer strategy

### UI5 Web Components

Use first because it provides the fastest credible path to SAP-facing visual
and interaction quality while SAP maintains the primitive library.

Accept it only if the experiment confirms:

- per-component imports and acceptable bundle contribution;
- reliable Vue/Nuxt events, properties, typing, and form integration;
- acceptable server-rendered layout, upgrade, LCP, CLS, and readiness;
- accessible keyboard and screen-reader behavior in owned compositions;
- no maintained forks or fragile shadow-DOM workarounds;
- enough primitives for Smart Field/Form/Filter/Table, Value Help, messages,
  List Report, and Object Page.

The renderer may look like SAP. The semantic core must not be SAP-component
shaped.

### Nuxt UI

Treat as a first-class renderer and the Vue-native baseline for:

- SSR/hydration;
- framework-native forms and validation presentation;
- controlled, virtualized tables;
- non-SAP-branded products;
- proving independence from UI5 Web Components.

Renderer capabilities may differ. Preserve common business semantics without
forcing a weak visual lowest common denominator.

## Framework strategy

| Support tier | Direction |
| --- | --- |
| Nuxt/Vue | Full product, SSR, extensions, UI5 WC and Nuxt UI renderers |
| React | Serious adapter passing the same controller/request traces |
| Angular/Svelte | Controller compatibility first; adapters with a consumer and maintainer |
| Other JS runtimes | Published headless contract, no ready-made component promise |

Do not expose Vue refs, React hooks, custom elements, or a state library from
core. Expose snapshot, subscription, event, and disposal semantics, then let
each adapter be idiomatic. Custom elements remain useful renderer leaves and a
possible later embedding facade, not the cross-framework state architecture.

## Strengths

- Reuses ODX instead of creating another OData transport stack.
- Isolates the differentiating work: semantic compilation, transactions, and
  floorplans.
- Gets primitive maintenance from UI5 WC without making its APIs durable core.
- Preserves a credible Nuxt UI/design-system migration path.
- Supports multiple frameworks without pretending composition is identical.
- Keeps raw metadata/vocabulary machinery out of production clients through
  build-time compilation.
- Serializable controllers enable trace tests, SSR state transfer, replay,
  DevTools, and variants.
- A separate repository protects ODX consumers from UI dependencies and cadence.
- Published packages enforce API discipline and support selective consumption.

## Risks and gates

| Risk | Why it matters | Mitigation or gate |
| --- | --- | --- |
| Scope is larger than Smart Fields | Transaction features interact | One fixed transactional vertical and capability tiers |
| Annotation semantics are deep | Partial support can be silently wrong | Lossless input, typed expressions, provenance, strict diagnostics |
| UI5 WC may be mistaken for Fiori Elements | Business state leaks into components | Headless controller tests before product UI |
| Neutrality may become lowest-common-denominator | Poor framework DX | Neutral semantics, idiomatic adapters, renderer capabilities |
| UI5 WC SSR may be costly | Upgrade can affect layout/readiness | Compare handwritten UI5 WC and Nuxt UI baselines |
| Transaction races can lose edits | Enterprise correctness is critical | Virtual-clock traces, ETags, cancellation, deterministic batches |
| V2 parity can consume the roadmap | Legacy behavior is broad | V4-first product and per-capability V2 matrix |
| SAP tooling may be unstable/Node-only | Reuse can cost more than ownership | Isolate and measure in metadata spike |
| Package count may outrun value | Release overhead | Define graph now; publish only implemented surfaces |
| Multi-framework promises dilute quality | Adapter cost compounds | Vue first, React proof, demand-driven adapters |
| Accessibility cannot be inherited | Compositions introduce failures | WCAG 2.2 AA testing per renderer |
| Separate repos add coordination | Private coupling slows delivery | Public ODX seam and compatibility fixtures |

## Claim and evidence register

| Claim | Evidence | Confidence | What overturns it |
| --- | --- | --- | --- |
| ODX is the foundation, not product owner | Current architecture/APIs | High | Product repeatedly requires private ODX state |
| Lossless metadata is needed | EntityMapping versus CSDL requirements | High | Existing wrapped package satisfies the owned contract |
| UI5 WC lowers primitive maintenance | Official docs/release model | Medium-high | Vertical needs forks or major reimplementation |
| UI5 WC lacks Smart/Fiori behavior | Official API/catalog scope | High for reviewed version | SAP publishes a fitting supported layer |
| Controllers can be framework neutral | Precedents and state model | Medium | Vue/React traces need divergent semantics |
| Build-time compilation is preferable | Static metadata and Nuxt goals | Medium-high | Dynamic services dominate or runtime AST fails |
| Nuxt UI can share semantics | Controlled form/table primitives | Medium | It duplicates annotation/query/transaction logic |
| A new repo is the clean boundary | Ownership/dependency differences | Medium-high | Persistent coordinated internals are essential |
| V4-first with V2 compatibility is viable | Standards and ODX support | Medium | First customers require missing V2 semantics |
| React is a useful portability proof | Different reactivity model | Medium | Another framework adds semantic, not adapter, needs |

Medium-confidence claims become decisions only after experiments produce
evidence.

## Roadmap

This is the roadmap referred to by the research. Dates should be assigned only
after staffing; progress is governed by exit criteria.

### Now: prove the architecture

Goal: decide whether the product boundary is real.

1. Spike a lossless metadata model without changing existing ODX APIs.
2. Build deterministic V2 structural, V4 transactional, and scale fixtures.
3. Compare SAP Open UX reuse with a focused parser behind one adapter.
4. Compile golden semantic bundles and diagnostics.
5. Implement headless collection, filter, object/form, operation, message,
   draft, side-effect, and transaction traces.
6. Build a Nuxt List Report/Object Page vertical with UI5 WC.
7. Render the same field/filter/table/form subset with Nuxt UI.
8. Build the React portability proof.
9. Record bundle, SSR, hydration, interaction, request, memory, and
   accessibility results.

Exit: explicit go, revise, or stop using [experiments.md](./experiments.md). No
production package promise precedes this exit.

### Next: establish the product foundation

Goal: publish a useful transactional 1.0 foundation.

- Publish the additive ODX metadata package after its contract is proven.
- Create the Nuxt Fiori repository and public package graph.
- Stabilize semantic bundle and controller contracts.
- Complete Smart Field, Form, Filter Bar, Table, Value Help, messages, List
  Report, and Object Page.
- Complete batching, ETags, create/delete, drafts, side effects, actions,
  variants, personalization, routing, and typed extensions.
- Support UI5 WC as the SAP renderer and Nuxt UI for the proven subset,
  expanding it according to demand.
- Integrate diagnostics with ODX Explorer or dedicated DevTools.
- Publish capability, V2/V4, browser, Nuxt/Vue, renderer, and accessibility
  support matrices.
- Add compatibility fixtures and a coordinated release policy.

Exit: production applications implement the transactional fixture without
private APIs or sample-specific code and pass frozen performance,
accessibility, and correctness gates.

### Later: broaden capability, not accidental complexity

- Complete Nuxt UI parity for the supported transactional surface.
- Publish React packages if the adapter has an owner and consumer.
- Add analytical tables/charts, aggregation, mass edit/export, semantic
  navigation, and richer app-state/deep-link handling.
- Evaluate Angular/Svelte adapters from real use cases.
- Add hierarchy, communication, authorization hints, collaboration, and
  offline capabilities only as separately proven extensions.
- Integrate FLP/Work Zone shells where needed; do not absorb shell replacement
  into the core by default.
- Reevaluate UI5 WC as default using measured maintenance and performance.

Exit: each added capability has an owner, fixture, diagnostics, compatibility
matrix, and measured renderer/framework cost.

## Non-negotiable implementation rules

- Existing ODX behavior and APIs are additive-only unless a separate breaking
  change is approved.
- All reusable packages are published.
- ODX remains UI-free and does not depend on Nuxt Fiori.
- Core contains no framework, renderer, router, or browser dependency.
- Renderers do not parse annotations or construct OData requests.
- Adapters do not decide SAP semantics.
- Production clients do not parse raw CSDL or ship the full compiler by default.
- Metadata and annotations are data, never executable JavaScript.
- Unsupported behavior is diagnosed, not silently approximated.
- Extensions target stable semantic IDs, not generated DOM.
- Application-level WCAG testing remains required.
- Dependencies are evidence-based and hidden behind owned contracts.
- V2 support is reported per capability and cannot regress ODX transport.

## Owner decisions before public naming

- final repository name and npm scope;
- V2 smart capabilities required by the first commercial consumer;
- Nuxt UI subset versus full parity expected at 1.0;
- variant persistence default and enterprise storage contract;
- minimum Nuxt/Vue/Node/browser support;
- theming target beyond SAP themes;
- extension compatibility/deprecation policy;
- FLP/Work Zone needs of the first adopter.

These alter release scope, not the core boundary.

## Threats to validity

- No implementation spike or benchmark has run yet.
- UI5 WC, Nuxt UI, Nuxt, and SAP tooling continue to evolve.
- Documentation cannot reveal every integration cost.
- The transactional model is representative, not every SAP scenario.
- React is a portability test, not proof of equal ergonomics everywhere.
- Public SAP samples should be references, not test dependencies.
- Performance budgets remain provisional until baselines run.
- The Cora live runner could not execute because its model required a newer
  local Codex runtime; its resolved evidence workflow was applied directly.

## Final recommendation

Approve the experiment and separate-repository direction provisionally.

Do not start by publishing a large Smart Components API. First prove the
metadata seam, semantic bundle, transaction trace, dual Vue renderers, and
React adapter. If they pass, this is a credible route to a more capable and
performant Fiori application framework without inheriting OpenUI5 as the
product runtime.

If they fail, the fixtures and measurements will identify whether the problem
is metadata ownership, transactions, renderer capability, SSR, or portability
before the ecosystem commits to a costly public API.

