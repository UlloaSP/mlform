---
title: Basic Form
description: A small form that submits to a prediction endpoint.
---

```html
<div id="basic-form"></div>
```

```ts
import { mountForm } from "mlform/kit";
import { createJsonTransport } from "mlform/transport";

mountForm(document.querySelector("#basic-form") as HTMLElement, {
  transport: createJsonTransport({ endpoint: "/api/predict" }),
  schema: {
    fields: [
      { id: "name", kind: "text", label: "Name", required: true },
      { id: "age", kind: "number", label: "Age", min: 0, max: 120 },
      {
        id: "department",
        kind: "category",
        label: "Department",
        options: ["Engineering", "Sales", "Support"],
      },
    ],
    reports: [{ id: "risk", kind: "classifier", label: "Risk" }],
  },
  labels: { submit: "Evaluate" },
});
```

The backend should return `reports.risk` with the payload the classifier report should display.
