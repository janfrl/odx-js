# Nuxt Fiori and Smart Components research

Status: recommendation ready for owner review; implementation is gated by the
documented experiments

This research investigates how ODX could support a low-maintenance,
metadata-driven application framework capable of replacing the application
framework responsibilities currently associated with OpenUI5 Smart Controls
and SAP Fiori Elements.

The initial direction evaluates UI5 Web Components as an enterprise component
renderer while preserving a path to Nuxt UI and other framework integrations.
No recommendation in this directory changes ODX behavior until it is accepted
and implemented through the normal project workflow.

## Recommendation

Create Nuxt Fiori as a separate product repository on published ODX packages.
Add only a lossless, UI-neutral metadata package to ODX. Build a framework-
neutral semantic/controller core, use UI5 Web Components for the first complete
renderer, and validate the boundary with Nuxt UI and React before publishing a
large product API.

## Artifacts

- [research-contract.md](./research-contract.md) - approved scope, questions,
  evidence rules, assumptions, and stop conditions.
- [report.md](./report.md) - synthesis, claim register, recommendation, and
  Now/Next/Later roadmap.
- [source-log.md](./source-log.md) - primary sources, local evidence, negative
  results, and research limits.
- [capability-matrix.md](./capability-matrix.md) - incumbent responsibilities,
  annotation tiers, renderer comparison, and ownership.
- [architecture.md](./architecture.md) - repository, package, semantic,
  controller, renderer, framework, SSR, and extension boundaries.
- [experiments.md](./experiments.md) - fixtures, hypotheses, benchmarks,
  accessibility checks, falsification tests, and hard stops.
