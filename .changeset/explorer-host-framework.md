---
'@me-tools/odx-explorer': patch
---

Declare Nuxt and Vue as consumer-owned peers for the Explorer layer instead of installing a second framework subtree. Standalone repository builds retain their pinned development dependencies; installed consumers use their compatible Nuxt 4 and Vue 3 runtime.
