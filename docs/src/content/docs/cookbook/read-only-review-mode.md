---
title: Read-only Review Mode
description: Lock user input while keeping values visible.
---

```ts
const reviewMode = true;

mountForm(container, {
  endpoint: "/api/predict",
  schema: {
    fields: [
      {
        id: "prompt",
        kind: "text",
        label: "Prompt",
        readOnlyWhen: () => reviewMode,
      },
    ],
    reports: [{ id: "prediction", kind: "classifier", label: "Prediction" }],
  },
  initialValues: { prompt: "Previously submitted text" },
});
```

Use read-only mode for review and audit screens. Use disabled mode when a value should not be submitted.
