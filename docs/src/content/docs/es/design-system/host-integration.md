---
title: Integracion Con Host
description: Embebe MLForm en aplicaciones host sin conflictos visuales.
---

Para aplicaciones embebidas, prefiere `mode: "inherit"` para que MLForm siga superficies claras u oscuras del host.

```ts
mountForm(container, {
  endpoint: "/api/predict",
  schema,
  designSystem: {
    mode: "inherit",
    theme: "neutral",
    recipe: "minimal",
  },
});
```

Usa `onDesignSystemChange` para inspeccionar el sistema resuelto:

```ts
mountForm(container, {
  endpoint: "/api/predict",
  schema,
  onDesignSystemChange(resolved) {
    console.log(resolved.effectiveScheme, resolved.themeId, resolved.recipeId);
  },
});
```

El handle montado tambien expone `updateDesignSystem`, `replaceDesignSystem` y `resetDesignSystem`.
