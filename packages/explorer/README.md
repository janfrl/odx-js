# @me-tools/odx-explorer

A high-fidelity DevTools UI built with Nuxt UI for inspecting OData schemas, traffic, and entity data.

## Installation

```bash
pnpm add @me-tools/odx-explorer
```

## Verification

Explorer is a Nuxt layer: its consumer supplies compatible Nuxt 4 and Vue 3
peer dependencies (`nuxt >=4.4.8 <5`, `vue >=3.5.39 <4`). It does not install a
second framework runtime below the layer. Standalone repository builds retain
their pinned development versions; an application extending the published
layer uses its own framework installation.

Run the Explorer package tests without the full workspace test suite:

```bash
pnpm --filter @me-tools/odx-explorer run verify
```

For documentation on the DevTools UI and debugging patterns, see the root
documentation in this repository.
