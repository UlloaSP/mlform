---
title: Design System Overview
description: Themes, recipes, modes, and overrides for embedded MLForm UI.
---

The kit attaches MLForm's design system automatically. Configure it with `designSystem`.

```ts
mountForm(container, {
  endpoint: "/api/predict",
  schema,
  designSystem: {
    mode: "auto",
    theme: "cobalt",
    recipe: "soft",
    overrides: {
      tokens: {
        "--mlf-control-height": "3rem",
      },
    },
  },
});
```

| Option      | Values                                                          |
| ----------- | --------------------------------------------------------------- |
| `mode`      | `light`, `dark`, `auto`, `inherit`                              |
| `theme`     | `neutral`, `cobalt`, `graphite`, `sage`, `sunset`, or custom id |
| `recipe`    | `default`, `minimal`, `soft`, `contrast`, or custom id          |
| `overrides` | Global tokens and component token overrides                     |

Use `mode: "inherit"` when the host app owns color-scheme state.
