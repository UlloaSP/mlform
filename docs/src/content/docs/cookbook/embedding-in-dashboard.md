---
title: Embedding in Dashboard
description: Blend MLForm into an existing dashboard shell.
---

```ts
mountForm(container, {
  endpoint: "/api/predict",
  schema,
  layout: "split",
  reportPane: "always",
  designSystem: {
    mode: "inherit",
    theme: "neutral",
    recipe: "minimal",
  },
});
```

Set `mode: "inherit"` when the dashboard already manages light and dark mode. Use `recipe: "minimal"` when dashboard cards, spacing, and borders already exist around the form.
