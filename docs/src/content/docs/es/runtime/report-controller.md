---
title: Report Controller
description: Estado, payload y descriptor de un informe.
---

| Miembro               | Propósito                          |
| --------------------- | ---------------------------------- |
| `id`                  | Id estable del informe.            |
| `kind`                | Tipo de informe.                   |
| `config`              | Config normalizada.                |
| `state`               | Estado actual del informe.         |
| `descriptor`          | Descriptor para renderer o `null`. |
| `subscribe(listener)` | Escucha cambios.                   |

`ReportStateSnapshot` contiene `payload`, `error` y `status`.
