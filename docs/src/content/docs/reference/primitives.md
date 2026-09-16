---
title: Primitives Reference
description: Built-in Web Components and primitive renderer APIs.
---

Exports from `mlform/primitives` include:

- `mountPrimitiveForm`
- `unmountPrimitiveForm`
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

`mountPrimitiveForm(container, form)` is the low-level renderer and expects an empty container by default. Most applications should use `mountForm` from `mlform/kit`.

Built-in ML kinds require `createBuiltinDescriptorRegistry()` from `mlform/kit` in the mount options. The matching headless definitions come from `createBuiltinMlRegistry()` in `mlform/builtins`.

Use `containerStrategy: "replace"` when you need to replace existing children and restore them on `unmount()`.
