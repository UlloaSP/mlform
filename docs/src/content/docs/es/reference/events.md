---
title: Eventos
description: Referencia de eventos primitive.
---

| Evento               | Cancelable | Detail                              |
| -------------------- | ---------- | ----------------------------------- |
| `mlf-submit-request` | Sí         | Contexto de petición.               |
| `mlf-submit-start`   | No         | `form`, `state`.                    |
| `mlf-submit-success` | No         | `form`, `state`, `result`.          |
| `mlf-submit-abort`   | No         | Contexto de cancelación.            |
| `mlf-submit-error`   | No         | `form`, `state`, `error`, `status`. |
