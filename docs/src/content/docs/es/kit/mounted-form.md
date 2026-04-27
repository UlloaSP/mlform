---
title: Mounted Form
description: Handle devuelto por mountForm.
---

`mountForm` devuelve un `MountedForm`.

| Miembro                         | Propósito                                   |
| ------------------------------- | ------------------------------------------- |
| `form`                          | Acceso al `FormController`.                 |
| `host`                          | Elemento host montado.                      |
| `engineRegistry`                | Registry de campos e informes.              |
| `primitiveRegistry`             | Registry de renderers.                      |
| `designSystemRegistry`          | Registry de temas y recipes.                |
| `designSystem`                  | Sistema de diseño adjunto.                  |
| `updateDesignSystem(config)`    | Mezcla cambios visuales.                    |
| `replaceDesignSystem(snapshot)` | Reemplaza modo, tema y recipe.              |
| `resetDesignSystem()`           | Restaura defaults.                          |
| `unmount()`                     | Cancela submits pendientes y limpia el DOM. |

Guarda el handle para cleanup en rutas, modales e integraciones con frameworks.
