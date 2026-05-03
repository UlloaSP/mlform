---
title: Exports Del Paquete
description: Rutas publicas de import expuestas por MLForm.
---

| Export                 | Uso                                                                                                                                 |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `mlform`               | API del kit para aplicaciones, incluyendo `mountForm`, `mountWizardForm`, `mountTabsForm`, `mountAccordionForm` y `createFormView`. |
| `mlform/kit`           | La misma superficie del kit con ruta explicita.                                                                                     |
| `mlform/runtime`       | Form controller, registry, schema, transport y tipos.                                                                               |
| `mlform/primitives`    | Web Components primitives y registry de renderers.                                                                                  |
| `mlform/design-system` | APIs de theme, recipe, tokens y runtime de diseño.                                                                                  |

Prefiere `mlform` para montar formularios en aplicaciones. Usa subpaths para integraciones avanzadas.
