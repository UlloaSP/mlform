---
title: Overview del sistema de diseño
description: Themes, recipes, modos y overrides.
---

```ts
mountForm(container, {
  transport: createJsonTransport({ endpoint: "/api/predict" }),
  schema,
  designSystem: {
    mode: "auto",
    theme: "cobalt",
    recipe: "soft",
  },
});
```

| Opción      | Valores                                                   |
| ----------- | --------------------------------------------------------- |
| `mode`      | `light`, `dark`, `auto`, `inherit`                        |
| `theme`     | `neutral`, `cobalt`, `graphite`, `sage`, `sunset`         |
| `recipe`    | `default`, `minimal`, `soft`, `contrast`                  |
| `overrides` | Tokens globales y por componente                          |
| `strict`    | Lanza error cuando ids o claves `--mlf-*` no son válidas  |
| `onWarning` | Recibe advertencias no fatales del resolver en desarrollo |

Usa `mode: "inherit"` cuando el host controla el tema claro/oscuro.

Prefiere aplicacion CSSOM-first cuando ya tienes un elemento real o un shadow root:

```ts
import { resolveDesignSystem, writeDesignSystemTokenDeclarations } from "mlform/design-system";

const resolved = resolveDesignSystem({
  theme: "cobalt",
  recipe: "soft",
});

writeDesignSystemTokenDeclarations(host.style, resolved);
```

Deja `createDesignSystemStylesheet(resolved, selector)` para generar texto CSS confiable.

Precedencia de resolución:

| Capa | Regla                                                                      |
| ---- | -------------------------------------------------------------------------- |
| 1    | Primero cargan los tokens base globales y por componente                   |
| 2    | `sharedTokens` del theme se aplican antes de los tokens del scheme         |
| 3    | Los tokens del recipe y de sus componentes pisan valores del theme         |
| 4    | `overrides.tokens` y `overrides.components.*.tokens` ganan al final        |
| 5    | `light`/`dark` usan modo explícito; `auto` usa sistema; `inherit` usa host |
| 6    | Si no existe scheme oscuro, se vuelve a light con `theme-fallback`         |

Diagnósticos:

- Ids de theme o recipe desconocidos hacen fallback a `neutral` y `default`.
- Claves `--mlf-*` desconocidas siguen permitidas por compatibilidad, pero aparecen en `resolved.warnings` y `onWarning`.
- Los buckets de componente avisan cuando un token conocido pertenece a otro componente.
- Prefiere `writeDesignSystemTokenDeclarations` para escribir tokens en `CSSStyleDeclaration`. Deja `createDesignSystemStylesheet` para generar texto CSS confiable.

Ciclo de vida del registry:

- `attachDesignSystem` y `mountForm` clonan el registry entregado al adjuntar.
- Cambios posteriores en el registry original no afectan instancias ya montadas.
- Para mutar una instancia montada, actualiza `attached.registry` o el registry del design system montado y luego fuerza refresh con `updateDesignSystem({})` u otra actualización de config.
