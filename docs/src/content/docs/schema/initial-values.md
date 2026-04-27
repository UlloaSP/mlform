---
title: Initial Values
description: How schema defaults and runtime initial values combine.
---

MLForm has two ways to set an initial field value.

| Source                         | Best for                                            | Example                                |
| ------------------------------ | --------------------------------------------------- | -------------------------------------- |
| `defaultValue` on a field      | Schema-owned defaults that travel with the schema.  | Default confidence threshold.          |
| `initialValues` in `mountForm` | Host-app state, user profile data, restored drafts. | Saved customer id or dashboard filter. |

`initialValues` takes precedence over `defaultValue`.

```ts
mountForm(container, {
  transport: createJsonTransport({ endpoint: "/api/predict" }),
  schema: {
    fields: [
      { id: "threshold", kind: "number", label: "Threshold", defaultValue: 0.7 },
      { id: "prompt", kind: "text", label: "Prompt" },
    ],
  },
  initialValues: {
    threshold: 0.85,
    prompt: "Existing draft text",
  },
});
```

## Recommended Usage

Put business defaults in the schema. Put host-specific or user-specific state in `initialValues`.

Avoid mixing both for the same field unless the precedence is intentional. Tests should assert the final value through `mounted.form.getValues()` when defaults matter.
