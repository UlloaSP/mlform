---
title: Regression Workflow
description: Render numeric model output with units and precision.
---

## Goal

Submit structured values and render one numeric score.

```ts
mountForm(container, {
  transport: createJsonTransport({ endpoint: "/api/price" }),
  schema: {
    fields: [
      { id: "area", kind: "number", label: "Area", min: 0, unit: "m2" },
      { id: "rooms", kind: "number", label: "Rooms", min: 1, step: 1 },
    ],
    reports: [
      { id: "price", kind: "regressor", label: "Estimated price", unit: "EUR", precision: 0 },
    ],
  },
});
```

Response:

```json
{
  "reports": {
    "price": {
      "value": 275000
    }
  }
}
```

Expected UI behavior: numeric inputs normalize empty values to `null`, validation runs before submit, and the regressor report renders with the configured unit and precision.

Mistakes to avoid:

| Mistake                               | Fix                                     |
| ------------------------------------- | --------------------------------------- |
| Treating empty number inputs as zero  | Handle `null` in the backend.           |
| Returning a string for numeric output | Return a numeric payload when possible. |

Next: [Conditional Form](./conditional-form/).
