---
title: Form Controller
description: Estado, validación, submit, reset y suscripciones.
---

| Miembro                                           | Propósito                          |
| ------------------------------------------------- | ---------------------------------- |
| `fields`                                          | Controladores de campos.           |
| `reports`                                         | Controladores de informes.         |
| `state`                                           | Snapshot de estado del formulario. |
| `getField(id)`                                    | Busca un campo.                    |
| `getReport(id)`                                   | Busca un informe.                  |
| `getValues()`                                     | Lee valores actuales.              |
| `setValues(values)`                               | Actualiza valores.                 |
| `validate()`                                      | Ejecuta validación.                |
| `submit(options?)`                                | Valida, envía y resuelve informes. |
| `abortSubmit(reason?)`                            | Cancela submit pendiente.          |
| `reset()`                                         | Restaura valores iniciales.        |
| `subscribe(listener)`                             | Escucha todo el estado.            |
| `subscribeSelector(selector, listener, options?)` | Escucha un valor derivado.         |

`submit()` puede lanzar `ValidationError`, `SubmitError` o `SubmissionAbortedError`.
