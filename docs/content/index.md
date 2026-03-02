---
navigation: false
---

::u-page-hero
#title
Modern [OData Developer Experience]{.text-primary} for Nuxt.

#description
**ODX** is a modular ecosystem designed to simplify SAP OData integration. :br From type-safe SDKs to interactive DevTools, it automates the friction of enterprise data.

#links
  :::u-button
  ---
  color: primary
  size: xl
  to: /getting-started
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
    icon: i-lucide-box
    ---
    #title
    Modular Ecosystem

    #description
    A collection of focused packages (`core`, `proxy`, `nuxt`, `explorer`) that work together to provide a seamless OData workflow.
    ::::

    ::::u-page-card
    ---
    spotlight: true
    icon: i-lucide-shield-check
    ---
    #title
    Type-Safe SDK

    #description
    Automated TypeScript model generation. Catch SAP-specific schema errors at compile time, ensuring reliable enterprise apps.
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
    Visualize complex EDMX schemas, monitor live OData traffic, and browse entity data directly within the Nuxt DevTools.
    ::::

    ::::u-page-card
    ---
    spotlight: true
    icon: i-lucide-server
    ---
    #title
    Smart Proxy

    #description
    Automated handling of CSRF tokens, Basic/Bearer auth, and version-specific OData nuances (V2 & V4).
    ::::

    ::::u-page-card
    ---
    spotlight: true
    icon: i-lucide-database
    ---
    #title
    Offline-Ready

    #description
    Mock your SAP backend with local JSON files. Perfect for rapid prototyping and isolated testing environments.
    ::::
  :::
::
