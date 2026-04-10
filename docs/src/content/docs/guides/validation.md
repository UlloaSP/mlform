---
title: Validation
description: Combine built-in constraints, custom validators, and hooks.
---

Validation runs before submit. Built-in fields validate their own constraints, such as text length, number ranges, category membership, date bounds, and time-series ordering.

Use form validators for cross-field rules:

```ts
validators: [
  ({ values }) => {
    if (Number(values.min) > Number(values.max)) {
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
