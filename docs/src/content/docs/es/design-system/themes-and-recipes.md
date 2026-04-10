---
title: Themes Y Recipes
description: Configura la apariencia de MLForm con themes y recipes integrados.
---

MLForm separa el theme de color de la recipe de presentacion.

Themes:

- `neutral`
- `cobalt`
- `graphite`
- `sage`
- `sunset`

Recipes:

- `default`
- `minimal`
- `soft`
- `contrast`

```ts
mountForm(container, {
  endpoint: "/api/predict",
  schema,
  designSystem: {
    mode: "auto",
    theme: "graphite",
    recipe: "contrast",
  },
});
```

Los modos son `light`, `dark`, `auto` e `inherit`. La densidad puede ser `compact`, `comfortable` o `spacious`. El movimiento puede ser `none`, `subtle` o `standard`.
