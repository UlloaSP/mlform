---
title: Conditions
description: Declarative field conditions for visibility, disabled state, and read-only state.
---

Fields can derive state from current form values:

```ts
{
  id: "details",
  kind: "text",
  label: "Details",
  hiddenWhen: {
    kind: "field-value",
    field: "include_details",
    notEquals: true
  }
}
```

Supported condition kinds:

| Kind                | Use                                                                            |
| ------------------- | ------------------------------------------------------------------------------ |
| `field-value`       | Compare one field with literals, ranges, sets, or empty/truthy state.          |
| `field-comparison`  | Compare two fields with `eq`, `neq`, `gt`, `gte`, `lt`, or `lte`.              |
| `form-status`       | React to `idle`, `editing`, `validating`, `submitting`, `success`, or `error`. |
| `submit-count`      | React to submit count.                                                         |
| `all`, `any`, `not` | Compose other conditions.                                                      |
