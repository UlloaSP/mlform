---
title: Resumen De Layouts
description: Entiende el modelo de layout headless usado por createFormView y los mounts oficiales.
---

MLForm separa:

- `schema` para datos, validacion y submit
- `layout` para estructura visual y navegacion

Superficies principales:

| Superficie             | Uso                                     |
| ---------------------- | --------------------------------------- |
| `mountForm()`          | UI integrada de una sola pagina         |
| `mountForm()`    | UI integrada tipo wizard                |
| `mountForm()`      | UI integrada tipo tabs                  |
| `mountForm()` | UI integrada tipo disclosure             |
| `createFormView()`     | API headless para shells personalizados |

Si omites `layout`, MLForm crea un `stacked` automatico con fields y reports en orden.
