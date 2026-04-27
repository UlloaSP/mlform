---
title: Recipes personalizadas
description: Define densidad, motion y chrome de componentes.
---

```ts
import {
  createDesignSystemRegistry,
  defineComponentTokens,
  defineGlobalTokens,
  defineRecipe,
} from "mlform/design-system";

const compactOps = defineRecipe({
  id: "compact-ops",
  label: "Compact ops",
  density: "compact",
  motion: "subtle",
  tokens: defineGlobalTokens({ "--mlf-radius-md": "6px" }),
  components: {
    field: defineComponentTokens("field", {
      "--mlf-field-shadow": "none",
    }),
  },
});

const designSystemRegistry = createDesignSystemRegistry().registerRecipe(compactOps);
```

Usa recipes para densidad, bordes, sombras y movimiento. Usa themes para color.
