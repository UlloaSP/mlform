---
title: Validation
description: Combine built-in constraints, custom validators, and hooks.
---

Built-in constraints are checked when values are initialized or changed, and again before submit.
They cover text length, number ranges and steps, category membership, date bounds, and Series
cell and point-count constraints. Series preserves row order; it does not sort observations.

## When validation runs

| Trigger | What runs |
| --- | --- |
| Defaults, `initialValues`, restored snapshots, or value changes | Required checks and the field definition's synchronous validation. |
| A built-in control loses focus, or `field.validate()` is called | Synchronous checks and the field definition's `validate` hook, which may be asynchronous. |
| `form.validate()` or submission | Field validation followed by form validators and validation hooks. |

Initial values do not automatically run asynchronous field checks or cross-field form validators.
Call `await mounted.form.validate()` after mounting when loaded data needs those checks too.

The built-in UI shows errors for nonempty invalid values immediately, including loaded examples.
Empty untouched fields remain quiet until edited, blurred, or explicitly validated. A boolean
`false` is a populated value: `required` requires a choice, not agreement. Valid populated editable
fields show a success message and check mark.

Hidden and disabled fields skip field validation. Read-only fields still validate. Including an
inactive field in the submission does not enable its field validation; see [Inactive Fields](/schema/inactive-fields/).

`mounted.submit()` reveals and focuses the first invalid field, opening its containing layout
when needed. Headless `form.submit()` rejects with `ValidationError` without moving DOM focus.

## Cross-field validation

Use form validators for cross-field rules:

```ts
validators: [
  ({ values }) => {
    if (typeof values.min === "number" && typeof values.max === "number" && values.min > values.max) {
      return { fields: { max: ["Max must be greater than min."] } };
    }
  },
];
```

Validators can return:

| Return value       | Meaning                |
| ------------------ | ---------------------- |
| `void`             | No issue.              |
| `string[]`         | Form-level errors.     |
| `{ form, fields }` | Form and field errors. |

Hooks can observe validation:

```ts
hooks: {
  beforeValidate({ values }) {},
  afterValidate({ result }) {},
}
```

If a validator reports an unknown field id, MLForm throws instead of silently dropping the error.
