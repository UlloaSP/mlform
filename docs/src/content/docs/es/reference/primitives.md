---
title: Referencia Primitives
description: Web Components integrados y APIs de renderer primitive.
---

Exports desde `mlform/primitives`:

- `mountForm`
- `unmountForm`
- `createPrimitiveRegistry`
- `createBuiltinPrimitiveRegistry`
- `PrimitiveFieldElement`
- `PrimitiveReportElement`

Eventos emitidos por primitive hosts:

| Evento               | Cuando                             |
| -------------------- | ---------------------------------- |
| `mlf-submit-request` | El boton de envio solicita submit. |
| `mlf-submit-start`   | Empieza el envio.                  |
| `mlf-submit-success` | El envio termina correctamente.    |
| `mlf-submit-abort`   | El envio se aborta.                |
| `mlf-submit-error`   | El envio falla.                    |

Los layouts son `stacked` y `split`.
