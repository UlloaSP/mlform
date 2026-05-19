---
title: Field Controller
description: Estado, descriptor, validación y suscripciones de un campo.
---

| Miembro               | Propósito                  |
| --------------------- | -------------------------- |
| `id`                  | Id estable del campo.      |
| `kind`                | Tipo de campo.             |
| `config`              | Config normalizada.        |
| `state`               | Estado actual.             |
| `descriptor`          | Descriptor para renderer.  |
| `setValue(value)`     | Cambia valor.              |
| `blur()`              | Marca touched.             |
| `focus()`             | Marca intención de foco.   |
| `validate()`          | Valida el campo.           |
| `reset()`             | Restaura el valor inicial. |
| `subscribe(listener)` | Escucha cambios.           |

El snapshot incluye `value`, `dirty`, `touched`, `valid`, `visible`, `disabled`, `readOnly`, `errors` y `status`.
