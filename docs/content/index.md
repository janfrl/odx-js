---
title: ODX - Modern SAP OData Integration
navigation: false
aside: false
---

::u-page-hero
---
description: ODX is a modular, framework-agnostic toolkit designed to bridge the gap between OData services and modern web applications. Built for standard OData V2 and V4 compliance.
---
#title
Modern [OData Developer Experience]{.text-primary}

#links
  :u-button{to="/ecosystem/introduction" label="Get started" trailing-icon="i-lucide-arrow-right" size="lg"}
  :u-button{to="https://github.com/janfrl/odx-js" label="GitHub" icon="i-simple-icons-github" variant="outline" size="lg"}
::

::u-page-section
  :::u-page-grid
    ::::u-page-card
    ---
    title: Universal Compatibility
    description: ODX works with any compliant OData V2 or V4 endpoint. Seamlessly connect to standard enterprise services and APIs.
    icon: i-lucide-globe
    spotlight: true
    ---
    ::::

    ::::u-page-card
    ---
    title: First-Class SAP Support
    description: Premium out-of-the-box support for SAP systems, handling NetWeaver routing, CSRF-Token pre-fetching, and auth.
    icon: i-simple-icons-sap
    spotlight: true
    ---
    ::::

    ::::u-page-card
    ---
    title: Type-Safe SDK
    description: Automated TypeScript model generation from your EDMX schema. Catch errors at compile time, not runtime.
    icon: i-lucide-shield-check
    spotlight: true
    ---
    ::::

    ::::u-page-card
    ---
    title: Nuxt-First DX
    description: Intuitive dot-notation syntax with built-in SSR support and zero-config setup.
    icon: i-lucide-zap
    spotlight: true
    ---
    ::::

    ::::u-page-card
    ---
    title: Deep Introspection
    description: Visualize complex schemas and monitor live OData traffic directly within Nuxt DevTools.
    icon: i-lucide-activity
    spotlight: true
    ---
    ::::

    ::::u-page-card
    ---
    title: Offline-Ready
    description: Mock any OData backend with local JSON files for rapid UI development.
    icon: i-lucide-database
    spotlight: true
    ---
    ::::
  :::
::

::u-page-section
---
title: Explore the Ecosystem
description: Choose the package that fits your architecture.
---
  :::u-page-grid
    ::::u-page-card
    ---
    title: Nuxt Module
    description: Zero-config OData integration for Nuxt 4 with auto-imports and DevTools.
    to: /nuxt/getting-started
    icon: i-lucide-zap
    ---
    ::::

    ::::u-page-card
    ---
    title: Proxy
    description: Standalone Nitro proxy for SAP BTP auth, CSRF, and routing.
    to: /proxy/installation
    icon: i-heroicons-server
    ---
    ::::

    ::::u-page-card
    ---
    title: Core SDK
    description: Framework-agnostic OData types and lightweight fetch client.
    to: /core/installation
    icon: i-heroicons-code-bracket
    ---
    ::::

    ::::u-page-card
    ---
    title: Explorer
    description: Browser-based DevTools for schema visualization and traffic monitoring.
    to: /explorer/setup
    icon: i-heroicons-computer-desktop
    ---
    ::::
  :::
::
