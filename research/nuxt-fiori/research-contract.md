# Research contract

Date: 2026-07-14

Mode: deep product research, read-only and proposal-first

Artifact target: A3 paper-grade decision support

## Goal

Determine whether and how to build a low-maintenance, capable, and performant
metadata-driven application framework on ODX that can replace the application
framework responsibilities of OpenUI5 Smart Controls and SAP Fiori Elements.

The research must evaluate UI5 Web Components as the initial enterprise UI
renderer, preserve a credible path to Nuxt UI, and identify how much of the
semantic and state layer can remain independent of Vue, Nuxt, React, Angular,
Svelte, and any individual component library.

## Research questions

1. Which responsibilities must be replaced across UI5 data binding, Smart
   Controls, Fiori Elements, and related application services?
2. Which OData and SAP annotations are required for useful transactional
   Smart Components and floorplans?
3. What belongs in an ODX-owned generic metadata contract, and what belongs in
   a higher application-semantic layer?
4. Which controller, query, validation, mutation, and view-model behavior can
   be framework neutral?
5. What must remain framework, renderer, routing, or host specific?
6. Do UI5 Web Components reduce maintenance enough to justify their runtime
   and integration costs?
7. Can a renderer contract support UI5 Web Components now and Nuxt UI later
   without becoming a lowest-common-denominator abstraction?
8. Which additional framework integrations are credible, and at what support
   tier?
9. Should the work live in this repository, incubate here and later extract,
   or start in a separate repository that depends on ODX?
10. Which vertical experiment can falsify the proposed architecture before a
    large implementation begins?

## Approved defaults

- Nuxt and Vue are the first-class product experience.
- Portability is tested with a framework-neutral controller surface and one
  serious second adapter rather than promising equal maturity everywhere.
- Initial replacement scope covers application semantics, Smart Components,
  data binding, and Fiori Elements-style transactional floorplans.
- Full Fiori Launchpad or SAP Build Work Zone replacement is an adjacent track,
  not an initial parity requirement.
- Capability replacement matters more than pixel-identical SAP rendering.
- UI5 Web Components are a candidate renderer, not a predetermined foundation.
- The research itself does not add runtime dependencies or implementation.

## Evidence rules

- Prefer official specifications, official documentation, maintained source
  repositories, release notes, and package metadata.
- Use community material for discovery only unless a primary source
  corroborates it.
- Separate facts, inferences, recommendations, human decisions, and unknowns.
- Map every major recommendation to evidence and a falsification path.
- Record negative results, inaccessible sources, temporal limits, and skipped
  validation.
- Treat current package and platform facts as dated observations, not durable
  truths.

## Required outputs

- capability and parity matrix
- annotation and semantic-model requirements
- framework-neutral ownership matrix
- UI5 Web Components and Nuxt UI renderer comparison
- framework support tiers
- repository and package placement decision
- benchmark and vertical-experiment plan
- claim register and evidence matrix
- threats to validity and negative results
- Now / Next / Later roadmap
- open human decisions before implementation

## Stop conditions

Stop before implementation, package creation, dependency installation, branch
creation, deployment, or publication. Stop earlier if primary evidence is
insufficient to support an architectural recommendation.
