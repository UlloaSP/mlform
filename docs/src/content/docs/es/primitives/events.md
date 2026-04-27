---
title: Eventos
description: Eventos de submit emitidos por primitives.
---

| Evento               | Detail                            |
| -------------------- | --------------------------------- |
| `mlf-submit-request` | El usuario solicitó submit.       |
| `mlf-submit-start`   | `{ form, state }`.                |
| `mlf-submit-success` | `{ form, state, result }`.        |
| `mlf-submit-abort`   | Submit cancelado.                 |
| `mlf-submit-error`   | `{ form, state, error, status }`. |

Usa hooks del engine para lógica de negocio. Usa eventos DOM para integración con host apps.
