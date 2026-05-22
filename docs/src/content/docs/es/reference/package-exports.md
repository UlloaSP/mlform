---
title: Exports Del Paquete
description: Rutas publicas de import expuestas por MLForm.
---

| Export                 | Uso                                                                                                                                 |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `mlform/kit`           | API del kit para aplicaciones: `mountForm`, helpers de layout, labels, defaults de diseño y `createFormView`. |
| `mlform/runtime`       | Form controller, validacion, hooks, condiciones y orquestacion de submit.                                     |
| `mlform/schema`        | Tipos de schema, normalizacion, helpers de registry y contratos de request backend.                          |
| `mlform/builtins`   | Fields, reports, presenters y pack ML por defecto.                                                           |
| `mlform/transport`     | Adapters transport, middleware, resiliencia y orquestacion.                                                  |
| `mlform/primitives`    | Web Components primitives y registry de renderers.                                                                                  |
| `mlform/design` | APIs de theme, recipe, tokens y runtime de diseño.                                                                                  |

Importa desde subpaths explicitos. El paquete no expone modulo raiz.
