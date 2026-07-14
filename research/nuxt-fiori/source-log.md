# Source log

Access date: 2026-07-14

This log records sources used for the Nuxt Fiori architecture recommendation.
Official specifications, product documentation, and maintained source
repositories are treated as evidence. Community material was used only for
discovery and is not cited as decision evidence.

## Local ODX evidence

| Source | Evidence used |
| --- | --- |
| [ODX README](../../README.md) | ODX supports OData V2 and V4, publishes core, proxy, Nuxt, and Explorer packages, and positions core as framework-agnostic. |
| [Architecture](../../ARCHITECTURE.md) | Package boundaries, proxy/runtime flow, metadata caching, generation, and the rule that core must not depend on a UI system. |
| [Domain model](../../DOMAIN_MODEL.md) | Current durable concepts for services, EDMX, entity mappings, keys, queries, and generated SDK access. |
| [API reference](../../API.md) | Current `useOData` collection/entity operations and production metadata-refresh behavior. |
| [Core types](../../packages/core/src/types.ts) | The current public query and metadata types; query construction is generic, while Explorer metadata is operational cache state. |
| [Core server metadata mapping](../../packages/core/src/server.ts) | The runtime entity mapping retains structural properties, keys, navigation properties, and associations, but not a lossless annotation model. |
| [Nuxt generator](../../packages/nuxt/src/generate.ts) | ODX already delegates SDK generation to `odata2ts` and caches metadata outside `.nuxt`. |
| [`useOData`](../../packages/nuxt/src/runtime/composables/useOData.ts) | The current runtime surface is typed CRUD/query access rather than a binding, transaction, or semantic UI engine. |

## OData standards

| Source | Evidence used |
| --- | --- |
| [OData 4.01 Part 1: Protocol](https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part1-protocol.html) | Protocol semantics including requests, changes, actions/functions, batch, concurrency, and errors. |
| [OData 4.01 Part 2: URL Conventions](https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html) | Resource paths and system query options that a collection/query controller must generate. |
| [OData CSDL XML 4.01](https://docs.oasis-open.org/odata/odata-csdl-xml/v4.01/odata-csdl-xml-v4.01.html) | XML metadata and annotation-expression representation. |
| [OData CSDL JSON 4.01](https://docs.oasis-open.org/odata/odata-csdl-json/v4.01/odata-csdl-json-v4.01.html) | JSON CSDL representation and the need for a representation-neutral semantic model. |
| [OData JSON Format 4.01](https://docs.oasis-open.org/odata/odata-json-format/v4.01/odata-json-format-v4.01.html) | Payload control information, instance annotations, links, and context metadata. |
| [OASIS Core vocabulary](https://oasis-tcs.github.io/odata-vocabularies/vocabularies/Org.OData.Core.V1.html) | Descriptions, computed/immutable semantics, alternate keys, schema version, and core annotation expressions. |
| [OASIS Capabilities vocabulary](https://oasis-tcs.github.io/odata-vocabularies/vocabularies/Org.OData.Capabilities.V1.html) | Declarative filter, sort, expand, search, batch, insert, update, delete, navigation, and operation restrictions. |
| [OASIS Validation vocabulary](https://oasis-tcs.github.io/odata-vocabularies/vocabularies/Org.OData.Validation.V1.html) | Pattern, ranges, allowed values, and related validation constraints. |

## SAP annotations and Fiori semantics

| Source | Evidence used |
| --- | --- |
| [SAP OData vocabularies](https://sap.github.io/odata-vocabularies/) | SAP vocabularies complement OASIS vocabularies and replace legacy SAP V2 annotations. |
| [SAP Common vocabulary](https://sap.github.io/odata-vocabularies/vocabularies/Common.html) | Labels, text arrangements, field control, messages, value lists, side effects, draft roots, semantic keys, units/currencies, masking, and defaults. |
| [SAP UI vocabulary](https://sap.github.io/odata-vocabularies/vocabularies/UI.html) | Technology-independent semantics for fields, line items, selection fields, facets, actions, presentation variants, criticality, and navigation. |
| [`sap.ui.mdc`](https://help.sap.com/docs/SAPUI5/d625376e710e40cb9d40e43e1b02933b/1dd2aa91115d43409452a271d11be95b.html) | SAP's metadata-driven controls decouple generic behavior from protocol/model specifics through delegates and a unified property-info format. |
| [Building Blocks](https://help.sap.com/docs/ABAP_PLATFORM_NEW/468a97775123488ab3345a0c48cadd8f/24c1304739dd4f19af0ce2482c4d9bbe.html) | Fiori building blocks are templating abstractions that produce control trees; they are not merely runtime UI controls. |
| [Flexible Programming Model](https://help.sap.com/docs/ABAP_PLATFORM_NEW/468a97775123488ab3345a0c48cadd8f/549749bd901440d4bb242282a16b0ec2.html) | Fiori Elements deliberately combines generated floorplans, building blocks, controller extensions, and custom pages. |
| [Fiori Elements feature map](https://help.sap.com/docs/sap_s4hana-on-premise/468a97775123488ab3345a0c48cadd8f/62d3f7c2a9424864921184fd6c7002eb.html) | Breadth of the replacement surface: fields, forms, tables, filters, charts, actions, messages, variants, navigation, and page layouts. |
| [List Report and Object Page](https://help.sap.com/docs/SAPUI5/538009aec85e4e99b31f4d2de2443abe/c0eec49db81a441e878f528c8f3d28de.html) | The principal transactional pairing: collection discovery/work followed by object view/edit/create. |
| [List Report design](https://experience.sap.com/fiori-design-web/list-report-header-sap-fiori-elements/) | Filter/search/view-management behavior and responsive header expectations. |
| [Object Page design](https://experience.sap.com/fiori-design-web/v1-50/object-page/) | Responsive object display/create/edit, sections, header, navigation, and action expectations. |
| [Value Help Dialog](https://help.sap.com/docs/SAPUI5/b2f662dd9d7a4ec680056733050b4d34/3faed838512648b099e14dfec458d847.html) | Value help is a coordinated filter/table/select workflow with annotation-based label fallbacks, not a simple select input. |
| [Side Effects](https://help.sap.com/docs/SAPUI5/b2f662dd9d7a4ec680056733050b4d34/e55b1853cea243e08e2b1c0c694b4b56.html) | Source/target property and entity semantics required to prevent stale UI after changes and actions. |
| [Draft Handling](https://help.sap.com/docs/SAPUI5/3f47ec0c79a547aeaa23090b74c9520c/ed9aa41c563a44b18701529c8327db4d.html) | Exclusive/collaborative draft behavior, background persistence, editing-status filtering, and activation/validation expectations. |
| [Fiori feature showcase](https://github.com/SAP-samples/fiori-elements-feature-showcase) | Maintained executable fixture containing a broad cross-section of Fiori Elements V4 behavior. |

## OpenUI5 data and application services

| Source | Evidence used |
| --- | --- |
| [OData V4 batch control](https://ui5.github.io/docs/04_Essentials/batch-control-74142a3.html) | Ordered batch groups, change sets, pending changes, reset, retry, and continue-on-error behavior. |
| [OData V4 side effects](https://ui5.github.io/docs/04_Essentials/initialization-and-read-requests-fccfb2e.html) | Context-level side-effect requests and their coordination with pending PATCH operations. |
| [OData V4 draft handling](https://ui5.github.io/docs/04_Essentials/draft-handling-with-the-odata-v4-model-40986e6.html) | Active/draft context replacement, ordered autosave, ETag use, prepare/activate sequencing, and cancel behavior. |
| [OData operations](https://ui5.github.io/docs/04_Essentials/odata-operations-b54f789.html) | Bound/unbound action and function invocation and return-value contexts. |
| [Message model](https://ui5.github.io/docs/04_Essentials/message-model-8956f0a.html) | Central message state is separate from its popover renderer. |
| [Personalization](https://ui5.github.io/docs/08_More_About_Controls/personalization-75c08fd.html) | Sorting, grouping, column configuration, variant persistence, and personalization UI are coordinated services. |

## Renderer candidates

| Source | Evidence used |
| --- | --- |
| [UI5 Web Components introduction](https://ui5.github.io/webcomponents/docs/) | Framework-agnostic enterprise UI primitives with accessibility, theming, i18n, and SAP design. |
| [Component packages](https://ui5.github.io/webcomponents/docs/getting-started/components-packages/) | Modular `main`, `fiori`, and `ai` packages with per-component imports. |
| [Component APIs](https://ui5.github.io/webcomponents/docs/getting-started/components-APIs/) | Web-platform properties, slots, events, and methods; host frameworks still provide application binding and state. |
| [Styling](https://ui5.github.io/webcomponents/docs/development/styling/) | SAP themes and CSS-variable-based customization. |
| [Release strategy](https://ui5.github.io/webcomponents/docs/Releases/) | SemVer, monthly stable releases, and the supported major-version policy. |
| [UI5 Web Components Form](https://ui5.github.io/webcomponents/components/Form/) | Responsive form layout, explicitly without native form submission behavior. |
| [UI5 Web Components repository](https://github.com/SAP/ui5-webcomponents) | Apache-2.0 source, modular implementation, and project positioning relative to OpenUI5. |
| [Nuxt UI introduction](https://ui.nuxt.com/docs/getting-started/) | Vue/Nuxt-native, SSR-compatible component system based on Reka UI, Tailwind CSS, and Tailwind Variants. |
| [Nuxt UI components](https://ui.nuxt.com/docs/components/) | Breadth of accessible forms, data display, overlays, navigation, and dashboard primitives. |
| [Nuxt UI Table](https://ui.nuxt.com/docs/components/table) | TanStack Table foundation, controlled state, server-fetch compatibility, and virtualization. |
| [Nuxt UI Form](https://ui.nuxt.com/docs/components/form) | Reactive state, Standard Schema validation, nested forms, and renderer-level error presentation. |
| [Nuxt UI SelectMenu](https://ui.nuxt.com/docs/components/select-menu) | Search, async data patterns, infinite scroll, and virtualization relevant to value-help rendering. |
| [Nuxt UI repository](https://github.com/nuxt/ui) | MIT licensing and maintained Vue/Nuxt implementation. |

## Portability and state architecture

| Source | Evidence used |
| --- | --- |
| [Vue and Web Components](https://vuejs.org/guide/extras/web-components.html) | Strong consumption support, but custom elements remain low-level and have composition, reactivity, typing, and SSR tradeoffs. |
| [React 19 custom elements](https://react.dev/blog/2024/12/05/react-19) | React now supports custom-element properties in client rendering and primitive attributes during SSR. |
| [Angular elements](https://angular.dev/guide/elements) | Custom events/properties are interoperable, while framework binding still needs an adapter. |
| [TanStack Table architecture](https://tanstack.com/table/latest/docs/introduction) | A framework-neutral state/API core with renderer-specific adapters is proven for state-heavy UI. |
| [TanStack Table vanilla core](https://tanstack.com/table/v8/docs/vanilla) | Non-standard frameworks can consume the same core directly. |
| [JSON Forms architecture](https://jsonforms.io/docs/architecture/) | UI-independent schema/form core plus React, Angular, Vue, and renderer-set layers is a close structural precedent. |
| [TanStack Store](https://tanstack.com/store/latest/docs/overview) | Framework-neutral store with focused framework adapters; candidate, not a selected dependency. |
| [XState](https://stately.ai/docs/xstate) | Framework-neutral state machines/actors and multiple framework integrations; candidate for complex transaction lifecycles. |

## Validation standards

| Source | Evidence used |
| --- | --- |
| [Core Web Vitals thresholds](https://web.dev/articles/defining-core-web-vitals-thresholds) | Current good thresholds use the 75th percentile: LCP at most 2.5 seconds, INP at most 200 milliseconds, and CLS at most 0.1. |
| [W3C WCAG overview](https://www.w3.org/WAI/standards-guidelines/wcag/) and [WCAG 2.2 Recommendation](https://www.w3.org/TR/WCAG22/) | WCAG 2.2 is the current W3C Recommendation used for the proposed application-level AA target. |

## Reuse candidates

| Source | Evidence used |
| --- | --- |
| [SAP Open UX Tools](https://github.com/SAP/open-ux-tools) | Apache-2.0, published `@sap-ux` modules intended for reusable Fiori tooling. Runtime/browser suitability is not established by the project overview. |
| [`@sap-ux/annotation-generator`](https://www.npmjs.com/package/@sap-ux/annotation-generator) | Confirms maintained packages for entity-model and annotation conversion/type work; primarily generation tooling. |
| [SAP annotation language server](https://www.npmjs.com/package/@sap/ux-cds-odata-language-server-extension) | Documents the breadth of OASIS and SAP vocabularies already modeled by SAP tooling. |

## Negative results and limits

- The Cora runner resolved the expected local workflow and repository context,
  but live execution failed because its configured model required a newer Codex
  runtime. The resolved Cora research guidance was read directly instead.
- No official UI5 Web Components documentation reviewed here promises an
  OData binding layer, Fiori Elements semantics, or end-to-end Nuxt SSR. Those
  are experiment subjects, not assumed capabilities.
- No dedicated UI5 Web Components `FilterBar`, `ObjectPage`, or variant
  management component was found in the official component catalog during this
  review. Absence from the catalog is recorded as a dated observation, not a
  permanent product claim.
- SAP Open UX annotation packages appear promising for build-time reuse, but
  their browser compatibility, bundle cost, API stability, and coverage of
  dynamic expressions were not validated by installing them.
- The research did not run comparative bundles, browser traces, accessibility
  audits, or live SAP-service compatibility tests. Those are deliberately
  specified as the next experiment rather than simulated in this report.

