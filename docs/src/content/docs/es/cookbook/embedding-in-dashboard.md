---
title: Embedding en dashboard
description: Integra MLForm en un dashboard existente.
---

```ts
mountForm(container, {
  transport: createJsonTransport({ endpoint: "/api/predict" }),
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

Usa `recipe: "minimal"` cuando el dashboard ya aporta cards, bordes y espaciado.
