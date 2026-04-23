---
title: Conditional Form
description: Use hidden, disabled, and read-only conditions.
---

## Goal

Show advanced fields only when the user opts in.

```ts
mountForm(container, {
  transport: createJsonTransport({ endpoint: "/api/predict" }),
  schema: {
    fields: [
      { id: "advanced", kind: "boolean", label: "Use advanced options" },
      {
        id: "temperature",
        kind: "number",
        label: "Temperature",
        min: 0,
        max: 2,
        defaultValue: 0.7,
        hiddenWhen: { kind: "field-value", field: "advanced", notEquals: true },
      },
      {
        id: "model",
        kind: "category",
        label: "Model",
        options: ["stable", "experimental"],
        readOnlyWhen: { kind: "form-status", equals: "submitting" },
      },
    ],
    reports: [{ id: "prediction", kind: "classifier", label: "Prediction" }],
  },
});
```

Expected UI behavior: hidden fields disappear from layout, read-only fields do not mutate state, and inactive values are omitted from submission by default.

Mistakes to avoid:

| Mistake                                    | Fix                                                             |
| ------------------------------------------ | --------------------------------------------------------------- |
| Expecting hidden values in submit payloads | Set `inactiveFieldPolicy: "include"` if the backend needs them. |
| Using function conditions in JSON schemas  | Use declarative conditions when schemas come from a backend.    |

Next: [Series Forecasting](./series-forecasting/).
