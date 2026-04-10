---
title: Themes And Recipes
description: Configure MLForm appearance through built-in themes and recipes.
---

MLForm separates color theme from layout recipe.

Themes:

- `neutral`
- `cobalt`
- `graphite`
- `sage`
- `sunset`

Recipes:

- `default`
- `minimal`
- `soft`
- `contrast`

```ts
mountForm(container, {
  endpoint: "/api/predict",
  schema,
  designSystem: {
    mode: "auto",
    theme: "graphite",
    recipe: "contrast",
  },
});
```

Modes are `light`, `dark`, `auto`, and `inherit`. Density options are `compact`, `comfortable`, and `spacious`. Motion options are `none`, `subtle`, and `standard`.
