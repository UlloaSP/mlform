---
title: Events
description: Primitive submit events reference.
---

| Event                | Cancelable | Detail fields                      |
| -------------------- | ---------- | ---------------------------------- |
| `mlf-submit-request` | Yes        | primitive request context          |
| `mlf-submit-start`   | No         | `form`, `state`                    |
| `mlf-submit-success` | No         | `form`, `state`, `result`          |
| `mlf-submit-abort`   | No         | abort context                      |
| `mlf-submit-error`   | No         | `form`, `state`, `error`, `status` |

Import types from `mlform/primitives` when you need typed event detail shapes.

```ts
import type { PrimitiveSubmitSuccessDetail } from "mlform/primitives";
```
