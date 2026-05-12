---
title: Schema
description: The FormSchema shape used by the current MLForm API.
---

A form schema has `fields` and optional `reports`.

```ts
import type { FormSchema } from "mlform/runtime";

const schema: FormSchema = {
  fields: [
    {
      id: "age",
      kind: "number",
      label: "Age",
      min: 0,
      max: 120,
      required: true,
    },
  ],
  reports: [
    {
      id: "risk",
      kind: "classifier",
      label: "Risk",
    },
  ],
};
```

Every field has a `kind` and `label`. `id` is optional; if omitted, MLForm derives a stable slug from the label and resolves duplicates.

Common field properties include `description`, `required`, `disabled`, `hidden`, `readOnly`, `defaultValue`, `ui`, and conditional variants such as `hiddenWhen`.
