---
title: Nuxt
description: The high-level Nuxt module for the ODX ecosystem.
---

The high-level Nuxt module that integrates the ODX ecosystem into your application. It provides the developer-facing API and automates the build-time SDK generation.

## Features

- **The `useOData` Composable:** A type-safe, reactive way to fetch data with elegant dot-notation.
- **Auto-Generation:** Automatically runs `odata2ts` during `prepare` to generate TypeScript models from your EDMX files.
- **Zero Config:** Automatically sets up proxy handlers and DevTools integration based on your `nuxt.config.ts`.
- **SSR Ready:** Fully optimized for Nuxt's server-side rendering and hydration patterns.

## Installation

::code-group
  ```bash [pnpm]
  pnpm add @bc8-odx/nuxt
  ```
  ```bash [npm]
  npm install @bc8-odx/nuxt
  ```
::
