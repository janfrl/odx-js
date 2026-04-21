# Quickstart: Contributing to ODX Documentation

This guide explains how to contribute to the ODX documentation and how the auto-generation process works.

## Documentation Structure

The documentation site is built with **Nuxt 4**, **Docus**, and **Nuxt UI v4**. All content is located in the `docs/content/` directory.

### Directory Mapping (DiÃ¡taxis)

- `docs/content/1.getting-started/`: Tutorials and introduction.
- `docs/content/2.nuxt/`: Nuxt-specific guides and configuration.
- `docs/content/3.proxy/`: Server-side proxy documentation.
- `docs/content/4.explorer/`: DevTools Explorer documentation.
- `docs/content/5.core/`: Core library documentation.
- `docs/content/6.guides/`: Goal-oriented how-to guides.

## Local Development

1.  **Install dependencies**:
    ```bash
    pnpm install
    ```
2.  **Start documentation server**:
    ```bash
    pnpm run docs
    ```
    The site will be available at `http://localhost:3000`.

## Writing Content

### Frontmatter

Every markdown file MUST have frontmatter defining its title and description:

```markdown
---
title: My New Page
description: A brief explanation of what this page covers.
---
```

### API Reference Tables

To include an auto-generated API reference table, use the `ApiReference` component:

```markdown
::ApiReference{name="ModuleOptions"}
::
```

The `name` prop MUST match an exported interface from `@bc8-odx/core`.

## Metadata Generation

The API metadata is generated using `untyped`. If you add new public interfaces or change existing ones:

1.  Ensure you have added proper **JSDoc comments** to the interface and its properties.
2.  Run the metadata extraction script (part of the docs build process).
3.  The `docs/.data/metadata.json` will be updated, and the changes will reflect on the site.

