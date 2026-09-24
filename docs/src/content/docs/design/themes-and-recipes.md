---
title: Themes And Recipes
description: Configure MLForm appearance through built-in themes and recipes.
---

MLForm separates color theme from layout recipe.

Without a `designSystem` option, the kit uses the `neutral` theme and `default` recipe. Fields and reports have restrained outlines and a sans-serif type stack. A field shows a green or red leading edge when an entered value is valid or has a visible error; the feedback text conveys the same state. Themes supply contrast-aware text colors for buttons and selected controls in light and dark mode.

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
import { predictionTransport } from "./prediction-transport";

mountForm(container, {
  transport: predictionTransport,
  schema,
  designSystem: {
    mode: "auto",
    theme: "graphite",
    recipe: "contrast",
  },
});
```

Modes are `light`, `dark`, `auto`, and `inherit`. Density options are `compact`, `comfortable`, and `spacious`. Motion options are `none`, `subtle`, and `standard`.
