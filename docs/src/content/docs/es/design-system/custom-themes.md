---
title: Themes personalizados
description: Define esquemas light y dark.
---

```ts
import { createDesignSystemRegistry, defineGlobalTokens, defineTheme } from "mlform/design-system";

const brandTheme = defineTheme({
  id: "brand",
  label: "Brand",
  schemes: {
    light: {
      tokens: defineGlobalTokens({ "--mlf-color-accent": "#0f766e" }),
    },
    dark: {
      tokens: defineGlobalTokens({ "--mlf-color-accent": "#5eead4" }),
    },
  },
});

const designSystemRegistry = createDesignSystemRegistry().registerTheme(brandTheme);
```

Los themes deben centrarse en color y tokens semánticos.

Las instancias montadas clonan el registry al adjuntar. Si registras un theme nuevo después, actualiza el registry de la instancia montada y fuerza refresh en vez de mutar solo el registry original.
