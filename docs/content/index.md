---
title: Modern OData Developer Experience for Nuxt
navigation: false
aside: false
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
    icon: i-lucide-box
    to: /nuxt
    ---
    #title
    Nuxt Module

    #description
    A powerful Nuxt 4 integration providing auto-imported composables and automated type generation.
    ::::

    ::::u-page-card
    ---
    spotlight: true
    icon: i-lucide-server
    to: /proxy
    ---
    #title
    Proxy Layer

    #description
    A robust server-side proxy handling CSRF tokens, authentication, and live request logging.
    ::::

    ::::u-page-card
    ---
    spotlight: true
    icon: i-lucide-computer-desktop
    to: /explorer
    ---
    #title
    Explorer UI

    #description
    Deep introspection into your SAP services with schema visualization and real-time traffic monitoring.
    ::::

    ::::u-page-card
    ---
    spotlight: true
    icon: i-lucide-code-bracket
    to: /core
    ---
    #title
    Core Utilities

    #description
    Framework-agnostic OData types and recursive data flattening tools for any TypeScript environment.
    ::::

    ::::u-page-card
    ---
    spotlight: true
    icon: i-lucide-shield-check
    ---
    #title
    Type Safe

    #description
    Automated TypeScript model generation from your actual SAP schema.
    ::::

    ::::u-page-card
    ---
    spotlight: true
    icon: i-lucide-database
    ---
    #title
    Offline Ready

    #description
    Mock your SAP backend with local JSON files for isolated development.
    ::::
  :::
::
