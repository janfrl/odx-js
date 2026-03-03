---
title: Modern OData Developer Experience
navigation: false
aside: false
---

::u-page-hero
#title
Modern [OData Developer Experience]{.text-primary}

#description
**ODX** is a modular, framework-agnostic toolkit designed to bridge the gap between OData services and modern web applications. :br Built for standard OData V2 and V4 compliance.

#links
  :::u-button
  ---
  color: primary
  size: xl
  to: /getting-started/introduction
  trailing-icon: i-lucide-arrow-right
  ---
  Get started
  :::

  :::u-button
  ---
  color: neutral
  icon: i-simple-icons-github
  size: xl
  to: https://github.com/janfrl/odx-js
  variant: outline
  ---
  GitHub
  :::
::

::u-page-section
  :::u-page-grid
    ::::u-page-card
    ---
    spotlight: true
    icon: i-lucide-globe
    ---
    #title
    Universal Compatibility

    #description
    ODX works with any compliant OData V2 or V4 endpoint. Seamlessly connect to standard enterprise services and APIs.
    ::::

    ::::u-page-card
    ---
    spotlight: true
    icon: i-simple-icons-sap
    ---
    #title
    First-Class SAP Support

    #description
    Premium out-of-the-box support for SAP systems, handling NetWeaver routing, automated CSRF-Token pre-fetching, and Basic/Bearer auth.
    ::::

    ::::u-page-card
    ---
    spotlight: true
    icon: i-lucide-shield-check
    ---
    #title
    Type-Safe SDK

    #description
    Automated TypeScript model generation from your EDMX schema. Catch errors at compile time, not runtime.
    ::::

    ::::u-page-card
    ---
    spotlight: true
    icon: i-lucide-zap
    ---
    #title
    Nuxt-First DX

    #description
    Intuitive dot-notation syntax with `useOData().Service.EntitySet.list()`. Built-in SSR support and zero-config setup.
    ::::

    ::::u-page-card
    ---
    spotlight: true
    icon: i-lucide-activity
    ---
    #title
    Deep Introspection

    #description
    Visualize complex schemas, monitor live OData traffic, and browse entity data directly within the Nuxt DevTools.
    ::::

    ::::u-page-card
    ---
    spotlight: true
    icon: i-lucide-database
    ---
    #title
    Offline-Ready

    #description
    Mock any OData backend with local JSON files. Build your UI even when the enterprise systems are offline.
    ::::
  :::
::
