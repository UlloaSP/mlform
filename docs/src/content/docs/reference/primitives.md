---
title: Primitives Reference
description: Built-in Web Components and primitive renderer APIs.
---

Exports from `mlform/primitives` include:

- `mountForm`
- `unmountForm`
- `createPrimitiveRegistry`
- `createBuiltinPrimitiveRegistry`
- `PrimitiveFieldElement`
- `PrimitiveReportElement`

Events emitted by primitive hosts:

| Event                | When                                 |
| -------------------- | ------------------------------------ |
| `mlf-submit-request` | The submit button requests a submit. |
| `mlf-submit-start`   | Submit begins.                       |
| `mlf-submit-success` | Submit resolves.                     |
| `mlf-submit-abort`   | Submit is aborted.                   |
| `mlf-submit-error`   | Submit fails.                        |

Layouts are `stacked` and `split`.

`mountForm(container, form)` expects an empty container by default.

Use `containerStrategy: "replace"` when you need to replace existing children and restore them on `unmount()`.
