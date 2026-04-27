---
title: Modelo mental
description: Cómo encajan schema, engine, transport, primitives y design system.
---

MLForm separa responsabilidades para que puedas empezar simple y bajar de nivel cuando lo necesites.

| Superficie     | Responsabilidad                                                  |
| -------------- | ---------------------------------------------------------------- |
| Schema         | Describe la intención: campos, informes, condiciones y defaults. |
| Engine         | Mantiene estado, validación, submit, informes y suscripciones.   |
| Transport      | Convierte un submit en una llamada a backend o modelo local.     |
| Primitives     | Renderiza descriptores del engine como Web Components.           |
| Design System  | Resuelve modo, tema, recipe y tokens visuales.                   |
| Mounted handle | Controla cleanup, acceso al engine y cambios visuales.           |

La mayoría de usuarios usa `mountForm`. Usuarios avanzados pueden usar el engine, primitives o registries directamente.
