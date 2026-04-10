---
title: Overview del sistema de diseño
description: Themes, recipes, modos y overrides.
---

```ts
mountForm(container, {
  endpoint: "/api/predict",
  schema,
  designSystem: {
    mode: "auto",
    theme: "cobalt",
    recipe: "soft",
  },
});
```

| Opción      | Valores                                           |
| ----------- | ------------------------------------------------- |
| `mode`      | `light`, `dark`, `auto`, `inherit`                |
| `theme`     | `neutral`, `cobalt`, `graphite`, `sage`, `sunset` |
| `recipe`    | `default`, `minimal`, `soft`, `contrast`          |
| `overrides` | Tokens globales y por componente                  |

Usa `mode: "inherit"` cuando el host controla el tema claro/oscuro.
