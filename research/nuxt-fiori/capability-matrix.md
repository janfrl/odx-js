# Capability and ownership matrix

Date: 2026-07-14

Status: research recommendation, not an implementation commitment

## What "replacement" means

A credible replacement for UI5 Smart Controls and Fiori Elements must replace
application behavior, not only visual components. It must be able to derive a
useful application from OData metadata and annotations, keep data consistent
through transactional changes, and still allow deliberate application-specific
extensions.

It does not initially mean:

- pixel-identical rendering of every SAP control;
- every historical OData V2 Smart Control feature;
- the Fiori Launchpad, SAP Build Work Zone, shell services, or intent-resolution
  infrastructure;
- every analytical, hierarchy, collaboration, or offline feature at version
  1.0;
- equal maturity across every JavaScript framework.

## Delivery tiers

| Tier | Meaning |
| --- | --- |
| Experiment | Must exist in the falsification vertical before a product repository is approved. |
| 1.0 floor | Required for a useful transactional List Report + Object Page product. |
| Next | Important parity after the transactional floor is stable. |
| Later | Valuable but not allowed to block the initial product. |
| Adjacent | Separate product track or host integration. |

## Incumbent responsibility map

| Capability | What UI5/Fiori currently supplies | Recommended owner | Delivery |
| --- | --- | --- | --- |
| Lossless CSDL model | Entity/container/type/operation graph, aliases, expressions, annotations | ODX metadata package | Experiment |
| V2/V4 transport | URL construction, auth/proxy, CSRF, CRUD/query | Existing ODX packages | Existing |
| Capability negotiation | Filter/sort/search/expand and mutation restrictions | Semantic core, based on ODX metadata | Experiment |
| Annotation resolution | Qualified terms, paths, inheritance, dynamic expressions, local overlays | Semantic compiler | Experiment |
| Field semantics | Label, type, format, text arrangement, unit/currency, criticality, hidden/read-only/mandatory state | Semantic core | Experiment |
| Field rendering | Input/display widget, accessibility markup, focus, keyboard and validation presentation | Renderer | Experiment |
| Value help | Value-list mapping, in/out parameters, dependent context, search/filter/query plan, selection | Semantic core + renderer | Experiment |
| Collection binding | Paging, filtering, sorting, search, count, selection, refresh, transient rows | Collection controller | Experiment |
| Table behavior | Columns, cells, personalization UI, virtualization, keyboard behavior | Controller + renderer | Experiment/1.0 |
| Object binding | Entity context, projection, pending changes, refresh, navigation consistency | Object controller | Experiment |
| Form behavior | Edit/view modes, dirty state, validation, reset/save, nested items | Form/object controllers | Experiment |
| Actions/functions | Availability, parameter collection, critical confirmation, invocation, result-context handling | Operation controller + renderer dialogs | Experiment |
| Batch/change sets | Grouping, ordered submission, atomicity, retry, reset, continue-on-error | Transaction runtime | 1.0 |
| Optimistic concurrency | ETags, conflict detection and recovery | ODX transport + transaction runtime | 1.0 |
| Side effects | Source tracking, target planning, refresh sequencing, action side effects | Side-effect graph + transaction runtime | Experiment |
| Messages | Parse protocol/state messages, target fields/entities, severity, lifecycle | Message controller + renderer | Experiment |
| Draft | Active/draft identity, edit, autosave, prepare, activate, discard, sibling replacement | Draft controller | Experiment |
| Create/delete | Transient context, defaults, containment, confirmation, rollback | Object/collection controller | 1.0 |
| Variants | Serializable filter/sort/column/page state | Variant controller + persistence port | 1.0 |
| Personalization | Stable IDs, available properties, reorder/show/group/sort state and UI | Semantic core + renderer | 1.0 |
| Navigation | Row/object/nav-property destinations, route state and context transfer | Semantic navigation intent + host router | 1.0 |
| List Report | Filter bar, table/views, page actions, messages, state | Floorplan controller + renderer | Experiment |
| Object Page | Header, facets/sections, forms/tables, edit actions, messages | Floorplan controller + renderer | Experiment |
| Flexible extensions | Custom fields, sections, actions, renderer overrides, controller hooks | Typed extension registry | 1.0 |
| App state/deep links | Restore filters, variants, selected object, layout | Host adapter + serializable controllers | Next |
| Charts/analytics | Aggregation, measures/dimensions, visualizations, drilldowns | Analytical controller + renderer | Next |
| Mass edit/export | Multi-context mutation and export orchestration | Controllers + renderer | Next |
| Hierarchies/tree table | Recursive hierarchy vocabulary, server query semantics, tree state | Specialized controller + renderer | Later |
| Collaborative drafts | Presence, shared draft state, concurrent edits | Draft extension + backend contract | Later |
| Offline/local-first | Replication, conflict resolution, queued mutation | Separate data-runtime extension | Later |
| FLP/Work Zone shell | Tiles, roles, intent navigation, shell services, notifications | Separate host product/integration | Adjacent |

## Annotation coverage

### Experiment subset

The architecture is not credible unless the first vertical handles all of these
as real semantics, not hard-coded sample behavior.

| Vocabulary | Terms or concepts | Why it is required |
| --- | --- | --- |
| OData CSDL | Entity sets, types, keys, navigation, containment, actions/functions, aliases, paths, expressions | Everything else depends on a correct graph and expression model. |
| Core | Computed/immutable properties, alternate keys, optimistic concurrency, descriptions | Correct editability, identity, conflict behavior, and developer diagnostics. |
| Capabilities | Filter/search/sort/expand, insert/update/delete, operation and navigation restrictions | Prevents rendering or issuing unsupported behavior. |
| Validation | Pattern, minimum/maximum, allowed values, length/nullability facets | Generates useful constraints without framework-specific schemas. |
| Common | Label, Text/TextArrangement, FieldControl, ValueList, units/currencies, Messages, SideEffects, DraftRoot, SemanticKey, IsActionCritical | Minimum enterprise field, transaction, and assisted-input behavior. |
| UI | HeaderInfo, SelectionFields, LineItem, Identification, FieldGroup, Facets/HeaderFacets, DataField variants, Hidden, Importance, Criticality, PresentationVariant | Minimum List Report/Object Page composition. |

### 1.0 floor

| Vocabulary | Terms or concepts | Why it is required |
| --- | --- | --- |
| Common | Defaults, value-list qualifiers and mappings, masking, sort order, semantic object hints | Complete common forms, safe presentation, and navigation extension points. |
| UI | SelectionVariant, SelectionPresentationVariant, DataPoint, connected fields, intent/URL navigation | Variants and richer transactional displays. |
| Measures | Unit and currency semantics | Correct formatting and query projection. |
| Capabilities | Batch details, deep insert/update declarations, custom parameters and response declarations | Robust transactional and nested behavior. |

### Deferred by design

| Vocabulary | Timing | Reason |
| --- | --- | --- |
| Aggregation and Analytics | Next | Requires an analytical query planner and chart/table semantics beyond transactional CRUD. |
| Hierarchy | Later | Recursive server queries and tree state need a dedicated controller. |
| Communication | Next/Later | Address/contact rendering is useful but not part of the architecture falsification. |
| Authorization | Next | UI enablement hints are useful, but backend authorization remains authoritative. |
| Temporal, Repeatability, JSON | Later | Important specialized protocol features, not initial floorplan blockers. |
| Experimental SAP terms | Opt-in only | SAP explicitly allows incompatible change/removal; production defaults must not depend on them. |

## V2 and V4 position

ODX must continue supporting both protocol generations. The Smart/Fiori product
should nevertheless be V4-first:

- OData V4 has the standards and current Fiori Elements building-block model
  needed for actions, CSDL expressions, draft, side effects, and efficient
  projection.
- V2 should enter through an explicit compatibility adapter that maps structural
  metadata and stable SAP V2 annotations into the same semantic intermediate
  representation.
- "Supports OData V2" must be expressed per capability. Basic list/detail CRUD
  can arrive earlier than full draft/action/side-effect parity.
- The compiler must preserve unsupported annotations and emit diagnostics; it
  must never silently reinterpret them.

This preserves existing ODX functionality without making the new product wait
for complete V2 parity.

## Ownership boundaries

| Concern | ODX | Semantic product core | Framework adapter | Renderer | Host application |
| --- | --- | --- | --- | --- | --- |
| Service config, proxy, CSRF, transport | Owns | Consumes through port | No | No | Configures |
| Lossless CSDL/annotation graph | Owns generic representation | Consumes | No | No | May supply overlays |
| SAP UI semantic interpretation | No | Owns | No | Consumes view specs | May override |
| Query/mutation planning | Executes transport request | Owns intent and transaction order | No | Emits user events | Configures policy |
| Observable state and events | No | Owns serializable controllers | Subscribes and adapts lifecycle | Renders snapshot | Coordinates pages |
| Component selection | No | Emits semantic kind/capability | No | Owns registry | Overrides registry |
| DOM, focus, slots, keyboard | No | No | Bridges framework lifecycle | Owns | May extend |
| SSR/hydration | Supplies server-safe transport | Supplies serializable state | Owns framework integration | Must be compatible | Owns route/data policy |
| Routing | No | Emits navigation intents | Bridges | Renders links/actions | Owns router |
| Variant persistence | No | Defines data and port | Bridges reactivity | Renders manager | Supplies storage |
| Theme/design system | No | Uses semantic tokens only | No | Owns | Configures |
| Product extensions | Protocol hooks only | Typed semantic/controller hooks | Framework composables/hooks | Slots/renderers | Registers extensions |

Non-negotiable dependency rules:

- ODX must not depend on the Smart/Fiori product.
- The semantic core must not import Vue, Nuxt, React, UI5 Web Components, Nuxt
  UI, a router, or a browser global.
- Renderers must not parse annotations or construct OData URLs.
- Framework adapters must not contain SAP annotation decisions.
- Host extensions must use stable semantic IDs, never generated DOM structure.

## Renderer comparison

| Criterion | UI5 Web Components | Nuxt UI | Architectural implication |
| --- | --- | --- | --- |
| SAP Fiori visual language | Native purpose | Not its purpose | UI5 WC is the lower-risk first renderer for SAP-facing adoption. |
| Framework portability | Web-standard custom elements | Vue/Nuxt only | UI library portability must not be confused with Smart Component portability. |
| Vue/Nuxt DX | Good consumption, but custom-element typing/events need integration | Native components, composables, slots, SSR | Nuxt UI is the stronger long-term Vue-native renderer. |
| Accessibility/i18n | Enterprise features maintained by SAP | Accessible Reka foundation and Nuxt i18n integration | Both reduce primitive maintenance; application compositions still require audits. |
| Forms | Inputs and responsive form layout; form layout is not submission/state | Native reactive form state, Standard Schema, nested validation | Transaction/form state remains in the semantic product either way. |
| Tables | UI5 table primitives and SAP styling | TanStack-powered controlled table, virtualization | Use a neutral collection controller; do not expose either table API from core. |
| Value help | Primitive dialogs/inputs/tables available | Search/select/modal/table primitives available | The multi-request value-help workflow is product-owned. |
| Floorplans/filter bar/variants | No complete Fiori Elements replacement found in the catalog | No OData/SAP semantic layer | Both require new orchestration components. |
| Theming | SAP themes and design tokens | Tailwind/Tailwind Variants and semantic tokens | Define semantic presentation tokens in view specs, map them in each renderer. |
| Modularity | Per-component ES-module imports | Tree-shaken Vue component system | Generate renderer imports from the compiled semantic bundle. |
| SSR | Not established by reviewed official docs; custom-element upgrade must be measured | Officially SSR-compatible | UI5 WC SSR/LCP/CLS is a mandatory experiment gate. |
| License | Apache-2.0 | MIT | Both are compatible candidates subject to normal dependency review. |
| Maintenance risk | SAP owns Fiori primitives; monthly stable releases | Nuxt team owns Vue primitives; active releases | Support both behind a renderer contract; never fork either library by default. |

Recommendation:

1. Start the first full vertical with UI5 Web Components because it minimizes
   Fiori visual/accessibility primitive work.
2. In the same experiment, render at least Smart Field and Smart Table through
   Nuxt UI without changing semantic controllers.
3. Treat Nuxt UI as the likely preferred renderer for non-SAP-branded products
   and a credible future default, not as a compatibility afterthought.
4. Do not implement Smart Components themselves as custom elements. Use
   framework components over headless controllers; custom elements remain an
   optional distribution facade for constrained embedding scenarios.

## Framework support tiers

| Tier | Framework | Commitment |
| --- | --- | --- |
| 1 | Nuxt + Vue | First-class module, components, composables, SSR, DevTools, typed extensions, UI5 WC renderer, and Nuxt UI renderer path. |
| 2 | React | Serious portability adapter after the neutral controller exists; prove collection + form + action/draft event traces against the same fixtures. UI5 WC can be consumed through its React integration or React 19 custom-element support. |
| 3 | Angular, Svelte | Core compatibility and documented adapter contract first. Official adapters only when a real consumer and maintainer exist. |
| Core | Vanilla TypeScript, Lit, other JS runtimes | Controller API usable through `getSnapshot`, `subscribe`, `dispatch`, and `dispose`; no promise of prebuilt Smart Components. |

React is the preferred second proof because its rendering and update model is
different enough from Vue to expose accidental Vue coupling. It is a validation
target, not an equal-launch requirement.

## Required diagnostics

A low-code semantic system fails dangerously when it silently guesses. The
compiler/runtime must surface:

- unsupported vocabulary, term, expression, or qualifier;
- unresolved annotation, property, navigation, or operation path;
- incompatible field-control and capability combinations;
- missing value-list parameters or target collections;
- cycles in side effects or derived visibility/field state;
- renderer without a mapping for a required semantic kind;
- feature degraded because the service is V2;
- unstable/experimental term used without opt-in;
- projection requirements that cannot be expressed by the service;
- duplicate or unstable extension IDs.

Diagnostics belong in generated output, development logs, and ODX Explorer
integration. Production behavior should follow an explicit strict/warn policy.

