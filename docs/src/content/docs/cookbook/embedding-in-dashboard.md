---
title: Embed in a dashboard
description: Fit a form into an existing dashboard that already owns color scheme, cards, and spacing.
---

```ts
mountForm(container, {
  schema,
  transport,
  layout: { kind: "split" },
  reportPane: "always",
  designSystem: {
    mode: "inherit",
    recipe: "minimal",
    hostSchemeResolver: () => (document.documentElement.classList.contains("dark") ? "dark" : "light"),
    overrides: { tokens: { "--mlf-color-accent": "var(--dashboard-accent)" } },
  },
});
```

- `mode: "inherit"` follows the dashboard's light or dark scheme. The resolver is only needed when
  the dashboard does not use `data-color-scheme` or CSS `color-scheme`; see
  [Modes](/design/themes-and-recipes/#modes).
- `recipe: "minimal"` is compact and still, for pages that already frame content in cards.
- `layout: { kind: "split" }` keeps reports beside the inputs on wide panels; `reportPane: "always"`
  shows the report area before the first submission.
- Token overrides can point at the dashboard's own CSS variables.

When the dashboard needs its own card markup around each control, use
[built-in controls in your layout](/kit/primitive-adapter/) instead of `mountForm`.
