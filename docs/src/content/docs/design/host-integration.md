---
title: Host Integration
description: Embed MLForm into host applications without visual conflicts.
---

For embedded apps, prefer `mode: "inherit"` so MLForm follows host light or dark surfaces.

```ts
import { predictionTransport } from "./prediction-transport";

mountForm(container, {
  transport: predictionTransport,
  schema,
  designSystem: {
    mode: "inherit",
    theme: "neutral",
    recipe: "minimal",
  },
});
```

Use `onDesignSystemChange` to inspect the resolved system:

```ts
mountForm(container, {
  transport: predictionTransport,
  schema,
  onDesignSystemChange(resolved) {
    console.log(resolved.effectiveScheme, resolved.themeId, resolved.recipeId);
  },
});
```

The mounted handle also exposes `updateDesignSystem`, `replaceDesignSystem`, and `resetDesignSystem`.
