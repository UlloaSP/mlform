---
title: Custom Recipes
description: Define density, motion, and component styling presets.
---

Recipes express UI behavior and component styling independent of theme colors.

```ts
import { createDesignSystemRegistry, defineRecipe } from "mlform/design-system";

const compactOps = defineRecipe({
  id: "compact-ops",
  label: "Compact ops",
  density: "compact",
  motion: "subtle",
  tokens: {
    "--mlf-radius-md": "6px",
  },
  components: {
    field: {
      tokens: {
        "--mlf-field-shadow": "none",
      },
    },
  },
});

const designSystemRegistry = createDesignSystemRegistry().registerRecipe(compactOps);
```

Use recipes for layout density, borders, shadows, motion, and component chrome. Use themes for color systems.
