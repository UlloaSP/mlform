---
title: Themes personalizados
description: Define esquemas light y dark.
---

```ts
import { createDesignSystemRegistry, defineTheme } from "mlform/design-system";

const brandTheme = defineTheme({
  id: "brand",
  label: "Brand",
  schemes: {
    light: { tokens: { "--mlf-color-accent": "#0f766e" } },
    dark: { tokens: { "--mlf-color-accent": "#5eead4" } },
  },
});

const designSystemRegistry = createDesignSystemRegistry().registerTheme(brandTheme);
```

Los themes deben centrarse en color y tokens semánticos.
