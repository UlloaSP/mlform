---
title: Basic Form
description: A small form that submits to a prediction endpoint.
---

```html
<div id="basic-form"></div>
```

```ts
import { mountForm } from "mlform/kit";
import { predictionTransport } from "./prediction-transport";

mountForm(document.querySelector("#basic-form") as HTMLElement, {
  transport: predictionTransport,
  schema: {
    fields: [
      { id: "name", mappedTo: "name", kind: "text", label: "Name", required: true },
      { id: "age", mappedTo: "age", kind: "number", label: "Age", min: 0, max: 120 },
      {
        id: "department",
        mappedTo: "department",
        kind: "category",
        label: "Department",
        options: ["Engineering", "Sales", "Support"],
      },
    ],
    reports: [{ id: "risk", mappedTo: "risk", kind: "classifier", label: "Risk" }],
  },
  labels: { submit: "Evaluate" },
});
```

The backend returns a `reports` array containing
`{ backend: "default", mappedTo: "risk", status: "ready", payload: { prediction: "low" } }`.
See [Backend Contract](/guides/backend-contract/) for request and response shapes.
