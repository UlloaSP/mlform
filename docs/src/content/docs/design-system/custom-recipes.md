---
title: Custom Recipes
description: Define density, motion, and component styling presets.
---

Recipes express UI behavior and component styling independent of theme colors.

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
  tokens: defineGlobalTokens({
    "--mlf-radius-md": "6px",
  }),
  components: {
    field: defineComponentTokens("field", {
      "--mlf-field-shadow": "none",
    }),
    submit: defineComponentTokens("submit", {
      "--mlf-submit-shadow": "none",
      "--mlf-submit-shadow-hover": "none",
    }),
  },
});

const designSystemRegistry = createDesignSystemRegistry().registerRecipe(compactOps);
```

Use recipes for layout density, borders, shadows, motion, and component chrome. Use themes for color systems.
