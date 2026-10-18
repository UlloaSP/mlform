---
title: Field Controller
description: Field state, validation, serialization, and subscriptions.
---

Each field has a `FieldController`.

Runtime controllers do not contain render descriptors. Use `view.getField(id)?.descriptor` from
[`createFormView`](/view/create-form-view/) when building a renderer around the view layer.

| Member                | Purpose                                        |
| --------------------- | ---------------------------------------------- |
| `id`                  | Stable field id.                               |
| `kind`                | Field kind.                                    |
| `config`              | Normalized field config.                       |
| `state`               | Current field state snapshot.                  |
| `serialize()`         | Serialize the current value through its definition. |
| `setValue(value)`     | Normalize, check synchronous constraints, mark touched, and recalculate dirty state. |
| `blur()`              | Mark touched.                                  |
| `focus()`             | No DOM effect in the headless runtime.         |
| `validate()`          | Run field validation.                          |
| `reset()`             | Restore initial value.                         |
| `subscribe(listener)` | Listen to field state changes.                 |

`FieldStateSnapshot` includes `value`, `initialValue`, `touched`, `dirty`, `valid`, `visible`, `disabled`, `readOnly`, `errors`, and `status`.

`dirty` compares the current normalized value with its initial value; assigning the initial value
again clears it. `blur()` marks the field touched but does not run asynchronous checks by itself.
Built-in controls call both `blur()` and `validate()` when focus leaves the control.

`setValue()` rejects changes to hidden, disabled, or read-only fields. Supply locked values through
schema defaults or `initialValues` during form creation. See [Validation](/guides/validation/) for
the distinction between synchronous checks, field validators, and form validators.

```ts
const threshold = mounted.form.getField("threshold");
threshold?.setValue(0.8);
await threshold?.validate();
```
