---
title: Custom Themes
description: Define custom light and dark token schemes.
---

Custom themes provide color and semantic tokens for light and dark schemes.

```ts
import { createDesignSystemRegistry, defineTheme } from "mlform/design-system";

const brandTheme = defineTheme({
  id: "brand",
  label: "Brand",
  schemes: {
    light: {
      tokens: {
        "--mlf-color-bg": "#f8fafc",
        "--mlf-color-surface": "#ffffff",
        "--mlf-color-text": "#102033",
        "--mlf-color-accent": "#0f766e",
      },
    },
    dark: {
      tokens: {
        "--mlf-color-bg": "#08111f",
        "--mlf-color-surface": "#111827",
        "--mlf-color-text": "#f8fafc",
        "--mlf-color-accent": "#5eead4",
      },
    },
  },
});

const designSystemRegistry = createDesignSystemRegistry().registerTheme(brandTheme);
```

Pass the registry and theme id to `mountForm`.
