---
title: Field Controller
description: Field state, descriptors, validation, and subscriptions.
---

Each field has a `FieldController`.

| Member                | Purpose                                        |
| --------------------- | ---------------------------------------------- |
| `id`                  | Stable field id.                               |
| `kind`                | Field kind.                                    |
| `config`              | Normalized field config.                       |
| `state`               | Current field state snapshot.                  |
| `descriptor`          | Renderer descriptor from the field definition. |
| `setValue(value)`     | Update value and mark dirty.                   |
| `blur()`              | Mark touched.                                  |
| `focus()`             | Mark the active intent.                        |
| `validate()`          | Run field validation.                          |
| `reset()`             | Restore initial value.                         |
| `subscribe(listener)` | Listen to field state changes.                 |

`FieldStateSnapshot` includes `value`, `initialValue`, `touched`, `dirty`, `valid`, `visible`, `disabled`, `readOnly`, `errors`, and `status`.

```ts
const threshold = mounted.form.getField("threshold");
threshold?.setValue(0.8);
await threshold?.validate();
```
