# Design

ODX has two main UI surfaces:

- The Docus documentation site under `docs`.
- The ODX Explorer DevTools UI under `packages/explorer`.

Both should feel modern, precise, and elegant, but their product jobs differ.
The docs site explains and markets the project; the Explorer is a dense
developer workbench.

## Design System

Use Nuxt UI as the default design system.

When Nuxt UI provides a component for a need, prefer it over custom markup:

- buttons: `UButton`
- icons: `UIcon`
- badges: `UBadge`
- tabs: `UTabs`
- tables: `UTable`
- cards: `UPageCard` or `UCard`
- page sections: `UPageSection`
- navigation: `UNavigationMenu`
- select controls: `USelect` or `USelectMenu`
- slideovers: `USlideover`
- toggles: `USwitch`
- keyboard hints: `UKbd`
- alerts: `UAlert`

Custom layout and CSS are acceptable when Nuxt UI does not cover the interaction
or when a complex workbench area needs exact sizing, scrolling, or graph
behavior.

## Visual Direction

The target look is modern and elegant, with a restrained shadcn-like quality:

- neutral surfaces
- clear borders and rings
- modest shadows
- compact spacing
- strong typography hierarchy
- crisp Iconify/Lucide icons
- useful dark mode
- limited decorative styling

Avoid heavy gradients, oversized marketing composition, ornamental backgrounds,
and one-off visual systems in the Explorer.

## Explorer Product Shape

Explorer is a tool, not a landing page. Optimize for repeated technical work:

- fast scanning
- stable layout
- compact controls
- predictable navigation
- dense tables
- readable code and JSON
- visible request state
- clear empty, loading, degraded, and error states

The existing structure is the baseline:

- narrow icon sidebar
- fixed header
- tabbed work areas
- scroll-contained panels
- rounded top workbench surfaces
- slideovers for secondary editing and configuration
- tables for logs and entity data
- graph controls for schema exploration

## Nuxt UI Theme

Current app config uses:

- primary color: `green`
- neutral color: `zinc`
- button cursor pointer override
- subtle card shadow

Preserve these defaults unless there is an intentional redesign. New colors
should work in both light and dark mode and should use Nuxt UI tokens where
possible.

## Component Guidance

Use icons in action buttons when the action is common or tool-like:

- refresh
- copy
- view
- edit
- delete
- filter
- download
- clear
- settings
- proxy trace

Use text labels when the action is destructive, uncommon, or benefits from
explicit wording.

Use `UTooltip` for icon-only controls whose meaning is not obvious.

Use `UBadge` for status, protocol/version, mode, and small metadata labels.

Use `UTabs` for peer views inside a stable panel. Do not use route-like tabs for
temporary toggles unless state should persist across the work area.

Use `USlideover` for focused secondary workflows such as service settings,
headers, payload view/edit, create, and update.

## Layout Rules

Keep workbench surfaces stable:

- fixed sidebars and headers should not resize during normal interaction
- tables should not shift when rows expand
- scrollable regions should have explicit min-height and overflow behavior
- long URLs, headers, JSON, and entity values must wrap, truncate, or scroll
  intentionally
- graph and table areas should use all available space instead of floating in
  decorative cards

Prefer full-height tool panels over stacked marketing sections in Explorer.

## Typography

Use compact typography in workbench UI:

- small uppercase labels for metadata groups
- monospace text for URLs, headers, JSON, generated code, methods, and IDs
- tabular numerals for durations and status-like metrics
- normal letter spacing unless a tiny technical label clearly benefits from
  uppercase treatment

Do not use hero-scale type inside Explorer panels.

## Documentation Site

The docs site can be more editorial than the Explorer, but it should still use
Docus and Nuxt UI primitives first.

Landing sections may use `UPageHero`, `UPageSection`, `UPageGrid`,
`UPageCard`, and `UPageCTA`. Keep landing examples concrete: show OData schema,
typed Nuxt usage, generated models, or real product state instead of generic
illustration.

## Accessibility

Preserve:

- keyboard-accessible controls
- visible focus states supplied by Nuxt UI
- sufficient contrast in light and dark mode
- semantic buttons for actions
- readable empty/error/loading states

When adding icon-only controls, provide a label or tooltip.

## Agent Checklist For UI Changes

Before finishing Explorer or docs UI work, check:

- Does a Nuxt UI component already solve this?
- Does the change preserve the green/zinc theme and dark mode?
- Does the UI remain dense and stable at DevTools dimensions?
- Are long technical strings handled deliberately?
- Are loading, empty, degraded, and error states covered?
- Are destructive actions clearly labeled or confirmed?
- Does the change avoid introducing a separate visual language?
